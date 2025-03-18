const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('มิวท์ผู้ใช้ในเซิร์ฟเวอร์')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('ผู้ใช้ที่ต้องการมิวท์')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('เหตุผลในการมิวท์')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('ระยะเวลาในการมิวท์ (ในนาที)')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const duration = interaction.options.getString('duration');
    
    // ตรวจสอบข้อมูลการป้อนค่า
    if (!user || !reason || !duration || isNaN(duration)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF5733)  // สีแดงส้ม
            .setTitle('❌ ข้อผิดพลาดในการมิวท์')
            .setDescription('กรุณาระบุข้อมูลให้ครบถ้วน (ผู้ใช้, เหตุผล, ระยะเวลา)')
            .setFooter({ text: 'โปรดตรวจสอบการป้อนข้อมูล' })
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    const muteDurationMs = parseInt(duration) * 60 * 1000;

    // ตรวจสอบสิทธิ์ของบอท
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.MuteMembers)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF5733)
            .setTitle('❌ ข้อผิดพลาด')
            .setDescription('บอทไม่มีสิทธิ์ในการมิวท์ผู้ใช้ โปรดให้สิทธิ์ **Mute Members** กับบอท')
            .setFooter({ text: 'โปรดตรวจสอบสิทธิ์ของบอท' })
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    try {
      const member = await interaction.guild.members.fetch(user.id);

      if (!member || member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF5733)
              .setTitle('❌ ข้อผิดพลาด')
              .setDescription('ไม่สามารถมิวท์ผู้ดูแลระบบได้หรือผู้ใช้ไม่พบ')
              .setFooter({ text: 'ไม่สามารถดำเนินการได้' })
              .setTimestamp()
          ],
          ephemeral: true
        });
      }

      if (member.roles.cache.some(role => role.name === 'Muted')) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF5733)
              .setTitle('❌ ข้อผิดพลาด')
              .setDescription('ผู้ใช้ถูกมิวท์อยู่แล้ว')
              .setFooter({ text: 'ผู้ใช้ถูกมิวท์อยู่แล้วในขณะนี้' })
              .setTimestamp()
          ],
          ephemeral: true
        });
      }

      // สร้างปุ่มการยืนยันและยกเลิก
      const confirmButton = new ButtonBuilder()
        .setCustomId('confirmMute')
        .setLabel('ยืนยันการมิวท์')
        .setStyle(ButtonStyle.Danger);

      const cancelButton = new ButtonBuilder()
        .setCustomId('cancelMute')
        .setLabel('ยกเลิก')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

      const embed = new EmbedBuilder()
        .setColor(0xFF5733)
        .setTitle('🔇 คุณกำลังจะมิวท์ผู้ใช้')
        .setDescription(`
          💬 **เหตุผล**: \`${reason}\`
          
          ⏳ **ระยะเวลา**: ${duration} นาที
        
          ⚠️ **โปรดกดปุ่มด้านล่างเพื่อยืนยันการมิวท์หรือยกเลิกการดำเนินการ!**
          
          ⬇️ คลิกปุ่มด้านล่างเพื่อทำการยืนยันหรือยกเลิกการมิวท์.
        `)
        .setFooter({ text: 'โปรดเลือกการดำเนินการ' })
        .setTimestamp();
    
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

      const filter = i => i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

      collector.on('collect', async i => {
        if (i.customId === 'confirmMute') {
          // ตรวจสอบการอยู่ในช่องเสียง
          if (member.voice.channel) {
            await member.voice.setMute(true);  // ตรวจสอบ voice channel
          }

          let muteRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
          if (!muteRole) {
            muteRole = await interaction.guild.roles.create({
              name: 'Muted',
              permissions: [],
            });

            interaction.guild.channels.cache.forEach(async (channel) => {
              await channel.permissionOverwrites.edit(muteRole, {
                [PermissionFlagsBits.SendMessages]: false,
                [PermissionFlagsBits.SendMessagesInThreads]: false,
                [PermissionFlagsBits.Speak]: false,
                [PermissionFlagsBits.Stream]: false,
                [PermissionFlagsBits.Connect]: false
              });
            });
          }

          await member.roles.add(muteRole);

          // ส่งข้อความแจ้งเตือนให้ผู้ใช้
          try {
            await user.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xFF5733)
                  .setTitle('คุณถูกมิวท์ในเซิร์ฟเวอร์')
                  .setDescription(`คุณถูกมิวท์ในเซิร์ฟเวอร์ **${interaction.guild.name}** ด้วยเหตุผล: ${reason}\nระยะเวลา: ${duration} นาที`)
                  .setFooter({ text: 'โปรดปฏิบัติตามกฎระเบียบของเซิร์ฟเวอร์' })
                  .setTimestamp()
              ]
            });
          } catch (err) {
            console.error('ไม่สามารถส่ง DM ได้:', err);
          }

          // กำหนดระยะเวลาในการปลดมิวท์
          setTimeout(async () => {
            await member.roles.remove(muteRole);
            if (member.voice.channel) await member.voice.setMute(false);  // ปลดมิวท์จาก voice channel

            await i.followUp({
              embeds: [
                new EmbedBuilder()
                  .setColor(0x00FF00)
                  .setTitle('✅ ผู้ใช้ถูกปลดมิวท์แล้ว')
                  .setDescription(`ผู้ใช้ <@${user.id}> ถูกปลดมิวท์หลังจากผ่านไป ${duration} นาที`)
                  .setFooter({ text: 'คำสั่งมิวท์ถูกยกเลิก' })
                  .setTimestamp()
              ],
              ephemeral: true
            });

            try {
              await user.send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('คุณถูกปลดมิวท์ในเซิร์ฟเวอร์')
                    .setDescription(`คุณถูกปลดมิวท์ในเซิร์ฟเวอร์ **${interaction.guild.name}** หลังจากระยะเวลา ${duration} นาที`)
                    .setFooter({ text: 'ขอบคุณที่ปฏิบัติตามกฎระเบียบ' })
                    .setTimestamp()
                ]
              });
            } catch (err) {
              console.error('ไม่สามารถส่ง DM ได้:', err);
            }
          }, muteDurationMs);

          await i.update({
            embeds: [
              new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ ผู้ใช้ถูกมิวท์')
                .setDescription(`ผู้ใช้ <@${user.id}> ถูกมิวท์แล้ว`)
                .addFields(
                  { name: 'เหตุผล', value: reason, inline: false },
                  { name: 'ระยะเวลา', value: `${duration} นาที`, inline: false }
                )
                .setFooter({ text: 'คำสั่งมิวท์สำเร็จ' })
                .setTimestamp()
            ],
            components: [],
            ephemeral: true,
          });
        } else if (i.customId === 'cancelMute') {
          await i.update({
            content: 'การมิวท์ถูกยกเลิก',
            components: [],
            ephemeral: true,
          });
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
          await interaction.editReply({
            content: 'หมดเวลายืนยันการมิวท์',
            components: [],
            ephemeral: true,
          });
        }
      });

    } catch (error) {
      console.error('Error muting user:', error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF5733)
            .setTitle('❌ ข้อผิดพลาด')
            .setDescription('เกิดข้อผิดพลาดในการมิวท์ผู้ใช้')
            .setFooter({ text: 'โปรดลองใหม่ในภายหลัง' })
            .setTimestamp()
        ],
        ephemeral: true
      });
    }
  },
};
