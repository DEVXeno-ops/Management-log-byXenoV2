const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
  } = require('discord.js');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('kick')
      .setDescription('เตะผู้ใช้จากเซิร์ฟเวอร์ (เฉพาะเจ้าของหรือแอดมิน)')
      .addUserOption(option => 
        option.setName('user')
          .setDescription('เลือกผู้ใช้ที่ต้องการเตะ')
          .setRequired(true)
      )
      .addStringOption(option => 
        option.setName('reason')
          .setDescription('เหตุผลในการเตะ')
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'ไม่ระบุเหตุผล';
      let member = interaction.guild.members.cache.get(user.id);
  
      if (!member) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('❌ ไม่พบผู้ใช้')
              .setDescription('ไม่สามารถดึงข้อมูลผู้ใช้จากเซิร์ฟเวอร์ได้!')
          ],
          ephemeral: true
        });
      }
  
      const executor = interaction.member;
  
      const adminRoleIds = ['ROLE_ID_1', 'ROLE_ID_2']; // ใส่ ID ของ Role ที่ต้องการให้เตะได้
  
      const isOwner = executor.id === interaction.guild.ownerId;
      const isAdmin = executor.roles.cache.some(role => adminRoleIds.includes(role.id));
  
      if (!isOwner && !isAdmin) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('🚫 คุณไม่มีสิทธิ์ใช้คำสั่งนี้')
              .setDescription('เฉพาะเจ้าของเซิร์ฟเวอร์หรือแอดมินเท่านั้นที่สามารถใช้คำสั่งนี้')
          ],
          ephemeral: true
        });
      }
  
      if (member.id === interaction.guild.ownerId) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('DarkRed')
              .setTitle('⛔ ไม่สามารถเตะเจ้าของเซิร์ฟเวอร์ได้!')
          ],
          ephemeral: true
        });
      }
  
      if (member.roles.cache.some(role => adminRoleIds.includes(role.id))) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('Orange')
              .setTitle('⚠️ ไม่สามารถเตะผู้ใช้คนนี้ได้')
              .setDescription('ผู้ใช้มีสิทธิ์แอดมินและได้รับการป้องกันจากการเตะ')
          ],
          ephemeral: true
        });
      }
  
      if (member.id === executor.id) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('Orange')
              .setTitle('⚠️ คุณไม่สามารถเตะตัวเองได้!')
          ],
          ephemeral: true
        });
      }
  
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('⚠️ บอทไม่มีสิทธิ์เตะ')
              .setDescription('โปรดให้สิทธิ์ **Kick Members** แก่บอท')
          ],
          ephemeral: true
        });
      }
  
      if (executor.roles.highest.position <= member.roles.highest.position && interaction.guild.members.me.roles.highest.position <= member.roles.highest.position) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('⛔ คุณไม่สามารถเตะผู้ใช้ที่มีสถานะสูงกว่าคุณได้!')
          ],
          ephemeral: true
        });
      }
  
      const kickEmbed = new EmbedBuilder()
        .setColor('DarkRed')
        .setTitle('🚨 ผู้ใช้ถูกเตะ 🚨')
        .setDescription(`**${user.tag}** ถูกเตะจากเซิร์ฟเวอร์`)
        .addFields(
          { name: '👤 ผู้ใช้', value: `<@${user.id}>`, inline: true },
          { name: '🛑 เหตุผล', value: reason, inline: true },
          { name: '🔨 ดำเนินการโดย', value: `<@${executor.id}>`, inline: false }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ text: 'Kick System', iconURL: interaction.client.user.displayAvatarURL() });
  
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_kick')
          .setLabel('✅ ยืนยันเตะ')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_kick')
          .setLabel('❌ ยกเลิก')
          .setStyle(ButtonStyle.Secondary)
      );
  
      const response = await interaction.reply({ embeds: [kickEmbed], components: [row], ephemeral: true });
  
      const filter = i => i.user.id === executor.id;
      const collector = response.createMessageComponentCollector({ filter, time: 15000 });
  
      collector.on('collect', async i => {
        if (i.customId === 'confirm_kick') {
          try {
            await user.send({
              embeds: [
                new EmbedBuilder()
                  .setColor('DarkRed')
                  .setTitle('🚨 **คุณถูกเตะจากเซิร์ฟเวอร์!** 🚨')
                  .setDescription(`**${user.tag}** คุณถูกเตะจากเซิร์ฟเวอร์ **${interaction.guild.name}** เนื่องจากเหตุผลที่ระบุด้านล่าง`)
                  .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                  .addFields(
                    { name: '🛑 **เหตุผล**', value: `**${reason}**`, inline: false },
                    { name: '🔨 **ดำเนินการโดย**', value: `<@${executor.id}>`, inline: false },
                    { name: '📅 **เวลาเตะ**', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false },
                    { name: '📝 **ติดต่อปลอดเตะ**', value: 'กรุณาติดต่อผู้ดูแลเซิร์ฟเวอร์เพื่อขอความช่วยเหลือในการยกเลิกการเตะ.', inline: false }
                  )
                  .setFooter({ text: 'Kick System • โปรดระวังการกระทำในเซิร์ฟเวอร์', iconURL: interaction.client.user.displayAvatarURL() })
                  .setTimestamp()
              ]
            }).catch(() => console.log(`❌ ไม่สามารถส่ง DM ถึง ${user.tag} ได้`));
  
            await member.kick(reason);
  
            await i.update({
              embeds: [kickEmbed.setDescription(`✅ **${user.tag}** ถูกเตะเรียบร้อย!`)],
              components: []
            });
  
            const logChannel = interaction.guild.channels.cache.find(c => c.name === 'mod-logs');
            if (logChannel) {
              logChannel.send({ embeds: [kickEmbed] });
            }
          } catch (error) {
            console.error('เกิดข้อผิดพลาดขณะพยายามเตะ:', error);
            await i.update({ content: '❌ เกิดข้อผิดพลาดขณะพยายามเตะผู้ใช้!', components: [] });
          }
        } else if (i.customId === 'cancel_kick') {
          await i.update({
            embeds: [
              new EmbedBuilder()
                .setColor('Green')
                .setTitle('✅ ยกเลิกการเตะ')
                .setDescription(`คำสั่งเตะของ **${user.tag}** ถูกยกเลิก`)
            ],
            components: []
          });
        }
      });
  
      collector.on('end', async () => {
        try {
          await interaction.editReply({ components: [] });
        } catch (error) {
          console.error('ไม่สามารถอัปเดตข้อความได้:', error);
        }
      });
    }
  };
  