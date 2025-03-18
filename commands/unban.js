const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits, ComponentType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('ยกเลิกการแบนผู้ใช้โดยใช้ UID')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('User ID ของผู้ใช้ที่ต้องการยกเลิกการแบน')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const userId = interaction.options.getString('userid');

    if (!userId || isNaN(userId)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ ข้อผิดพลาด')
            .setDescription('กรุณาระบุ User ID ที่ถูกต้อง')
        ],
        ephemeral: true
      });
    }

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ ข้อผิดพลาด')
            .setDescription('บอทไม่มีสิทธิ์ในการยกเลิกการแบน โปรดให้สิทธิ์ **Ban Members** กับบอท')
        ],
        ephemeral: true
      });
    }

    try {
      const bans = await interaction.guild.bans.fetch();
      const bannedUser = bans.get(userId);

      if (!bannedUser) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('❌ ไม่พบผู้ใช้ที่ถูกแบน')
              .setDescription(`ไม่มีการแบนที่เกี่ยวข้องกับ ID: **${userId}**`)
          ],
          ephemeral: true
        });
      }

      const confirmEmbed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('🔄 ยืนยันการยกเลิกการแบน')
        .setDescription(`คุณต้องการยกเลิกการแบนผู้ใช้ <@${userId}> หรือไม่?`)
        .setFooter({ text: 'Unban System', iconURL: interaction.client.user.displayAvatarURL() })
        .setTimestamp();

      const unbanButton = new ButtonBuilder()
        .setCustomId(`unban_confirm_${interaction.id}`)
        .setLabel('✅ ยืนยัน')
        .setStyle(ButtonStyle.Success);

      const cancelButton = new ButtonBuilder()
        .setCustomId(`unban_cancel_${interaction.id}`)
        .setLabel('❌ ยกเลิก')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(unbanButton, cancelButton);

      const response = await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });

      // ใช้ Collector แทน Event Listener ปกติ
      const filter = (btnInt) => btnInt.user.id === interaction.user.id;
      const collector = response.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000 });

      collector.on('collect', async (btnInt) => {
        if (btnInt.customId === `unban_confirm_${interaction.id}`) {
          try {
            await interaction.guild.bans.remove(userId);
            await btnInt.update({
              embeds: [
                new EmbedBuilder()
                  .setColor('Green')
                  .setTitle('✅ ยกเลิกการแบนสำเร็จ')
                  .setDescription(`ผู้ใช้ <@${userId}> ถูกยกเลิกการแบนแล้ว!`)
              ],
              components: [],
              ephemeral: true
            });
            collector.stop(); // หยุดการเก็บข้อมูลทันทีเมื่อทำการยกเลิกแบน
          } catch (error) {
            console.error('Error unbanning user:', error);
            await btnInt.update({
              embeds: [
                new EmbedBuilder()
                  .setColor('Red')
                  .setTitle('❌ ข้อผิดพลาด')
                  .setDescription('เกิดข้อผิดพลาดในการยกเลิกการแบน โปรดตรวจสอบสิทธิ์ของบอท')
              ],
              components: [],
              ephemeral: true
            });
            collector.stop(); // หยุดการเก็บข้อมูลเมื่อเกิดข้อผิดพลาด
          }
        } else if (btnInt.customId === `unban_cancel_${interaction.id}`) {
          await btnInt.update({
            embeds: [
              new EmbedBuilder()
                .setColor('Grey')
                .setTitle('❌ ยกเลิกการดำเนินการ')
                .setDescription(`การยกเลิกแบนสำหรับ <@${userId}> ถูกยกเลิกแล้ว`)
            ],
            components: [],
            ephemeral: true
          });
          collector.stop(); // หยุดการเก็บข้อมูลเมื่อผู้ใช้ยกเลิก
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor('Grey')
                .setTitle('⌛ หมดเวลา')
                .setDescription('คุณไม่ได้ดำเนินการภายใน 60 วินาที คำขอนี้ถูกยกเลิกแล้ว')
            ],
            components: []
          });
        }
      });

    } catch (error) {
      console.error('Error fetching bans:', error);
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ ข้อผิดพลาด')
            .setDescription('เกิดข้อผิดพลาดในการยกเลิกการแบน')
        ],
        ephemeral: true
      });
    }
  }
};
