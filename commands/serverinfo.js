const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('แสดงข้อมูลของเซิร์ฟเวอร์'),

  async execute(interaction) {
    try {
      const guild = interaction.guild;

      // ดึงข้อมูลสมาชิกออนไลน์และออฟไลน์
      const onlineMembers = guild.members.cache.filter(member => member.presence?.status === 'online').size;
      const offlineMembers = guild.memberCount - onlineMembers;

      // ดึงข้อมูล URL ไอคอน และ Vanity URL
      const iconURLPromise = guild.iconURL({ size: 2048 }) || 'https://via.placeholder.com/2048x2048.png?text=No+Icon';
      const vanityURLPromise = guild.vanityURL ? `https://discord.gg/${guild.vanityURL}` : 'ไม่มี Vanity URL';

      // ดึงเจ้าของเซิร์ฟเวอร์
      const ownerPromise = guild.fetchOwner().then(owner => `<@${owner.id}>`).catch(() => 'ไม่ทราบเจ้าของ');

      // สร้าง Embed
      const [iconURL, vanityURL, owner] = await Promise.all([iconURLPromise, vanityURLPromise, ownerPromise]);

      const serverInfoEmbed = new EmbedBuilder()
        .setColor('#FF69B4')
        .setTitle(`ข้อมูลของเซิร์ฟเวอร์ ${guild.name}`)
        .setThumbnail(iconURL)
        .setAuthor({ name: `${guild.name} - ข้อมูลเซิร์ฟเวอร์`, iconURL })
        .addFields(
          { name: 'ชื่อเซิร์ฟเวอร์', value: guild.name, inline: true },
          { name: 'จำนวนสมาชิก', value: `${guild.memberCount}`, inline: true },
          { name: 'จำนวนผู้ใช้ออนไลน์', value: `${onlineMembers}`, inline: true },
          { name: 'จำนวนผู้ใช้ออฟไลน์', value: `${offlineMembers}`, inline: true },
          { name: 'จำนวนช่องทั้งหมด', value: `${guild.channels.cache.size}`, inline: true },
          { name: 'จำนวนช่องข้อความ', value: `${guild.channels.cache.filter(c => c.type === 'GUILD_TEXT').size}`, inline: true },
          { name: 'จำนวนช่องเสียง', value: `${guild.channels.cache.filter(c => c.type === 'GUILD_VOICE').size}`, inline: true },
          { name: 'จำนวนโรล', value: `${guild.roles.cache.size}`, inline: true },
          { name: 'วันที่สร้าง', value: guild.createdAt.toLocaleString(), inline: true },
          { name: 'เจ้าของเซิร์ฟเวอร์', value: owner, inline: true },
          { name: 'บทบาทสูงสุด', value: `${guild.roles.highest.name}`, inline: true },
          { name: 'Vanity URL', value: vanityURL, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `ข้อมูลจากบอท Discord`, iconURL: interaction.client.user.avatarURL() });

      // ส่ง Embed
      await interaction.reply({
        embeds: [serverInfoEmbed],
        ephemeral: true, // แสดงให้เฉพาะผู้ที่ใช้คำสั่ง
      });

    } catch (error) {
      console.error('เกิดข้อผิดพลาดในคำสั่ง serverinfo:', error);
      await interaction.reply({
        content: '❌ เกิดข้อผิดพลาดในการดึงข้อมูลเซิร์ฟเวอร์!',
        ephemeral: true, // ข้อความแสดงให้เฉพาะผู้ใช้ที่ใช้คำสั่ง
      });
    }
  }
};
