const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const si = require('systeminformation');  // To get system information

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')  // ชื่อคำสั่ง
    .setDescription('แสดงข้อมูลของบอทแบบ real-time'), // แสดงข้อมูลของบอทแบบ real-time

  async execute(interaction) {
    try {
      // ดึงข้อมูลของบอท
      const bot = interaction.client.user;

      // ดึงข้อมูลเซิร์ฟเวอร์ที่บอทเข้าร่วม
      const guildCount = interaction.client.guilds.cache.size;
      const userCount = interaction.client.users.cache.size;
      const ping = interaction.client.ws.ping;
      const uptime = Math.floor(interaction.client.uptime / 1000);  // เวลาออนไลน์ (ในวินาที)

      // ดึงข้อมูลระบบ (RAM, CPU, Disk) ด้วย systeminformation
      const systemData = await si.mem();
      const cpuData = await si.cpu();
      const cpuLoad = await si.currentLoad();  // ใช้เพื่อดึงการใช้งาน CPU
      const diskData = await si.fsSize();

      // คำนวณการใช้ RAM และพื้นที่ดิสก์
      const totalRAM = (systemData.total / 1024 / 1024 / 1024).toFixed(2); // GB
      const usedRAM = ((systemData.total - systemData.free) / 1024 / 1024 / 1024).toFixed(2); // GB
      const diskUsed = ((diskData[0].used / 1024 / 1024 / 1024).toFixed(2)); // GB
      const diskTotal = ((diskData[0].size / 1024 / 1024 / 1024).toFixed(2)); // GB
      const cpuPercentage = cpuLoad.currentLoad.toFixed(2);  // CPU ใช้งานเป็นเปอร์เซ็นต์

      // สร้าง Embed Message สำหรับข้อมูลของบอท
      let botInfoEmbed = new EmbedBuilder()
        .setColor('#FF69B4') // สีชมพู
        .setTitle(`ข้อมูลของบอท ${bot.username}`)
        .setThumbnail(bot.displayAvatarURL({ dynamic: true })) // รูปโปรไฟล์ของบอท
        .setAuthor({ name: bot.username, iconURL: bot.displayAvatarURL({ dynamic: true }) })
        .setDescription(`บอทนี้ถูกสร้างขึ้นเพื่อช่วยจัดการและให้ข้อมูลต่างๆ ในเซิร์ฟเวอร์ Discord!`)
        .addFields(
          { name: 'ชื่อบอท', value: `${bot.username} ${bot.tag}`, inline: true },
          { name: '📅 วันที่สมัครบัญชี', value: bot.createdAt.toLocaleString(), inline: true },
          { name: '💬 สถานะ', value: bot.presence ? bot.presence.status : 'ไม่ออนไลน์', inline: true },
          { name: '📡 คำอธิบาย', value: 'บอทของเราจะช่วยให้เซิร์ฟเวอร์ของคุณมีประสิทธิภาพมากขึ้น!', inline: false },
          { name: '📊 Events received', value: 'กำลังดึงข้อมูล...', inline: true },
          { name: '💾 Ram usage (Cluster)', value: `${usedRAM}GB / ${totalRAM}GB`, inline: true },
          { name: '🧠 Ram usage (Total)', value: `${usedRAM}GB / ${totalRAM}GB`, inline: true },
          { name: '👥 Users', value: `${userCount}`, inline: true },
          { name: '🌐 Guilds', value: `${guildCount}`, inline: true },
          { name: '📶 Ping', value: `${ping} ms`, inline: true },
          { name: '⏱️ Online since', value: `${new Date(uptime * 1000).toISOString().substr(11, 8)}`, inline: true },
          { name: '🔢 Shard Guilds', value: 'กำลังดึงข้อมูล...', inline: true },
          { name: '🔢 Total Shards', value: 'กำลังดึงข้อมูล...', inline: true },
          { name: '🌍 Total Clusters', value: 'กำลังดึงข้อมูล...', inline: true },
          { name: '📡 ShardID', value: 'กำลังดึงข้อมูล...', inline: true }
        )
        .setTimestamp()
        .setFooter({
          text: 'ข้อมูลจากบอท Discord',
          iconURL: 'https://example.com/your-logo.png'  // ใส่ URL ของโลโก้หากต้องการ
        })
        .setImage('https://example.com/your-banner.png');  // ถ้าคุณต้องการเพิ่มภาพแบนเนอร์

      // ส่ง Embed ไปยังผู้ใช้
      await interaction.reply({
        content: 'กำลังดึงข้อมูลของบอท... โปรดรอ...',
        embeds: [botInfoEmbed],
        ephemeral: false,  // คำตอบจะเป็นแบบไม่ ephemeral (แสดงให้ทุกคนเห็น)
      });

    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลบอท:', error);
      await interaction.reply({
        content: 'เกิดข้อผิดพลาดในการดึงข้อมูลบอท!',
        ephemeral: true,
      });
    }
  },
};
