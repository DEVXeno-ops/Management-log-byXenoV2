const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const si = require('systeminformation');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')  
    .setDescription('แสดงข้อมูลของบอทแบบ real-time'),

  async execute(interaction) {
    try {
      await interaction.deferReply(); // ป้องกัน interaction timeout

      const bot = interaction.client.user;
      const guildCount = interaction.client.guilds.cache.size;
      const userCount = interaction.client.users.cache.size;
      const ping = interaction.client.ws.ping;
      const uptime = Math.floor(interaction.client.uptime / 1000); 

      // ดึงข้อมูลระบบ
      const systemData = await si.mem();
      const cpuLoad = await si.currentLoad();
      const diskData = await si.fsSize();

      // คำนวณข้อมูลระบบ
      const totalRAM = (systemData.total / 1024 / 1024 / 1024).toFixed(2);
      const usedRAM = ((systemData.total - systemData.free) / 1024 / 1024 / 1024).toFixed(2);
      const diskUsed = (diskData[0].used / 1024 / 1024 / 1024).toFixed(2);
      const diskTotal = (diskData[0].size / 1024 / 1024 / 1024).toFixed(2);
      const cpuPercentage = cpuLoad.currentLoad.toFixed(2);

      // Embed ข้อมูลบอท
      const botInfoEmbed = new EmbedBuilder()
        .setColor('#FF69B4') 
        .setTitle(`ข้อมูลของบอท: ${bot.username}`)
        .setThumbnail(bot.displayAvatarURL({ dynamic: true })) 
        .setAuthor({ name: bot.username, iconURL: bot.displayAvatarURL({ dynamic: true }) })
        .setDescription('บอทนี้ถูกสร้างขึ้นเพื่อช่วยจัดการและให้ข้อมูลต่างๆ ในเซิร์ฟเวอร์ Discord!')
        .addFields(
          { name: '🆔 ชื่อบอท', value: `${bot.globalName || bot.username}`, inline: true }, // ✅ แก้ `bot.discriminator`
          { name: '📅 วันที่สมัคร', value: bot.createdAt.toISOString().split('T')[0], inline: true },
          { name: '💬 สถานะ', value: bot.presence?.status ?? 'ไม่ออนไลน์', inline: true }, // ✅ ป้องกัน `null`
          { name: '👥 จำนวนผู้ใช้', value: `${userCount}`, inline: true },
          { name: '🌐 จำนวนเซิร์ฟเวอร์', value: `${guildCount}`, inline: true },
          { name: '📶 Ping', value: `${ping} ms`, inline: true },
          { name: '⏱️ ออนไลน์มาแล้ว', value: `${new Date(uptime * 1000).toISOString().substr(11, 8)}`, inline: true },
          { name: '💾 RAM Usage', value: `${usedRAM}GB / ${totalRAM}GB`, inline: true },
          { name: '🖥️ CPU Usage', value: `${cpuPercentage}%`, inline: true },
          { name: '📀 Disk Usage', value: `${diskUsed}GB / ${diskTotal}GB`, inline: true }
        )
        .setTimestamp()
        .setFooter({
          text: 'ข้อมูลจากบอท Discord',
          iconURL: bot.displayAvatarURL({ dynamic: true }) 
        });

      // ส่งข้อมูลไปยัง Discord
      await interaction.editReply({ embeds: [botInfoEmbed] });

    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      await interaction.editReply({
        content: '❌ ไม่สามารถดึงข้อมูลบอทได้!',
      });
    }
  },
};
