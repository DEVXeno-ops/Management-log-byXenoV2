const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getGuildSettings, saveGuildSettings } = require('../settings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('ตั้งค่าระบบป้องกันลิงก์')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('antilink')
        .setDescription('เปิดหรือปิดระบบป้องกันลิงก์ และตั้งค่า Role ที่ส่งลิงก์ได้')
    ),

  // คำสั่งหลักในการตั้งค่าระบบ
  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้', ephemeral: true });
      }

      const guildId = interaction.guild.id;
      let settings = await getGuildSettings(guildId);
      settings = settings ?? { antiLinkEnabled: false, allowedRoles: [] };

      const embed = new EmbedBuilder()
        .setColor(settings.antiLinkEnabled ? 0x00FF00 : 0xFF0000)
        .setTitle(`🔒 ระบบป้องกันลิงก์ ${settings.antiLinkEnabled ? '✅ เปิด' : '❌ ปิด'}`)
        .setDescription('คุณสามารถเลือก Role ที่สามารถส่งลิงก์ได้จากเมนูด้านล่าง')
        .setFooter({ text: 'คลิกปุ่มเพื่อเปิด/ปิดระบบ' })
        .setTimestamp();

      const toggleButton = new ButtonBuilder()
        .setCustomId('toggle-antilink')
        .setLabel(settings.antiLinkEnabled ? 'ปิดระบบ' : 'เปิดระบบ')
        .setStyle(settings.antiLinkEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

      const roles = interaction.guild.roles.cache
        .filter(role => role.id !== interaction.guild.id)  // กรอง @everyone
        .map(role => ({ label: role.name, value: role.id }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select-allowed-role')
        .setPlaceholder('เลือก Role ที่สามารถส่งลิงก์ได้')
        .setMinValues(0)
        .setMaxValues(Math.min(roles.length, 25))
        .addOptions(roles);

      const row = new ActionRowBuilder().addComponents(selectMenu);
      const buttonRow = new ActionRowBuilder().addComponents(toggleButton);

      await interaction.reply({ embeds: [embed], components: [row, buttonRow], ephemeral: true });
    } catch (error) {
      console.error('Error executing setup command:', error);  // แสดงข้อผิดพลาดในคอนโซล
      interaction.reply({ content: 'เกิดข้อผิดพลาดในการดำเนินการคำสั่ง', ephemeral: true });
    }
  },

  // การจัดการการคลิกปุ่ม Toggle
  async buttonInteraction(interaction) {
    try {
      if (!interaction.isButton()) return;
      if (interaction.customId !== 'toggle-antilink') return;

      const guildId = interaction.guild.id;
      let settings = await getGuildSettings(guildId);
      settings = settings ?? { antiLinkEnabled: false, allowedRoles: [] };

      // ตรวจสอบสิทธิ์ของสมาชิกก่อนเปลี่ยนการตั้งค่า
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ คุณไม่มีสิทธิ์เปลี่ยนการตั้งค่านี้', ephemeral: true });
      }

      settings.antiLinkEnabled = !settings.antiLinkEnabled;  // สลับสถานะการเปิด/ปิดระบบ
      await saveGuildSettings(guildId, settings);

      const embed = new EmbedBuilder()
        .setColor(settings.antiLinkEnabled ? 0x00FF00 : 0xFF0000)
        .setTitle(`🔒 ระบบป้องกันลิงก์ ${settings.antiLinkEnabled ? '✅ เปิด' : '❌ ปิด'}`)
        .setDescription(settings.antiLinkEnabled ? 'ระบบป้องกันลิงก์เปิดใช้งานแล้ว' : 'ระบบป้องกันลิงก์ถูกปิดใช้งาน')
        .setFooter({ text: 'คลิกปุ่มเพื่อเปิด/ปิดระบบ' })
        .setTimestamp();

      const toggleButton = new ButtonBuilder()
        .setCustomId('toggle-antilink')
        .setLabel(settings.antiLinkEnabled ? 'ปิดระบบ' : 'เปิดระบบ')
        .setStyle(settings.antiLinkEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(toggleButton);

      await interaction.deferUpdate();  // ป้องกันปุ่มถูกคลิกซ้ำ
      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error('Error in button interaction:', error);  // แสดงข้อผิดพลาดในคอนโซล
      interaction.reply({ content: 'เกิดข้อผิดพลาดในการเปลี่ยนการตั้งค่า', ephemeral: true });
    }
  },

  // การจัดการการเลือก Role ที่สามารถส่งลิงก์ได้
  async selectMenuInteraction(interaction) {
    try {
      if (!interaction.isStringSelectMenu()) return;
      if (interaction.customId !== 'select-allowed-role') return;

      const guildId = interaction.guild.id;
      let settings = await getGuildSettings(guildId);
      settings = settings ?? { allowedRoles: [] };

      // ตรวจสอบว่ามีการเลือก role หรือไม่
      if (interaction.values.length === 0) {
        return interaction.reply({ content: '❌ คุณต้องเลือกอย่างน้อยหนึ่ง Role ที่สามารถส่งลิงก์ได้', ephemeral: true });
      }

      settings.allowedRoles = interaction.values;
      await saveGuildSettings(guildId, settings);

      await interaction.deferUpdate();  // ป้องกันการคลิกซ้ำ
      await interaction.editReply({
        content: '✅ อัปเดต Role ที่สามารถส่งลิงก์ได้เรียบร้อย!',
        components: [],  // ซ่อน select menu หลังจากอัปเดตเสร็จ
        ephemeral: true
      });
    } catch (error) {
      console.error('Error in select menu interaction:', error);  // แสดงข้อผิดพลาดในคอนโซล
      interaction.reply({ content: 'เกิดข้อผิดพลาดในการอัปเดต Role', ephemeral: true });
    }
  }
};
