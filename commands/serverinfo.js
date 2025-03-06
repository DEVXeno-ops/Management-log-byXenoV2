const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('แสดงข้อมูลของเซิร์ฟเวอร์'),

  async execute(interaction) {
    const guild = interaction.guild;

    // ข้อมูลออนไลน์
    const onlineMembers = guild.members.cache.filter(member => member.presence?.status === 'online').size;
    // จำนวนสมาชิกที่ไม่ออนไลน์
    const offlineMembers = guild.memberCount - onlineMembers;

    // สร้าง Embed Message
    const serverInfoEmbed = new EmbedBuilder()
      .setColor('#FF69B4') // สีชมพู
      .setTitle(`ข้อมูลของเซิร์ฟเวอร์ ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 2048 })) // รูปภาพไอคอนของเซิร์ฟเวอร์
      .setAuthor({ name: `${guild.name} - ข้อมูลเซิร์ฟเวอร์`, iconURL: guild.iconURL() })
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
        { name: 'เจ้าของเซิร์ฟเวอร์', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'บทบาทสูงสุด', value: `${guild.roles.highest.name}`, inline: true },
        { name: 'Vanity URL', value: guild.vanityURL ? `${guild.vanityURL}` : 'ไม่มี', inline: true }
      )
      .setTimestamp() // แสดงเวลาปัจจุบัน
      .setFooter({ text: `ข้อมูลจากบอท Discord`, iconURL: interaction.client.user.avatarURL() });

    // Set the URL if there is a valid vanity URL
    if (guild.vanityURL) {
      serverInfoEmbed.setURL(`https://discord.gg/${guild.vanityURL}`);
    }

    // ส่ง Embed ไปยังผู้ใช้
    await interaction.reply({
      embeds: [serverInfoEmbed],
      flags: 64, // Use flags instead of ephemeral
    });
  }
};
