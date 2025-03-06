require('dotenv').config();
const { Client, GatewayIntentBits, Events, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
  ],
});

client.commands = new Collection();
const token = process.env.DISCORD_TOKEN || '';

// ฟังก์ชั่นสำหรับการสแกนข้อผิดพลาด
const logError = (error, context) => {
  console.error('❌ ข้อผิดพลาดเกิดขึ้น:', context);
  console.error('ข้อความผิดพลาด:', error.message);
  console.error('Stack trace:', error.stack);
};

// โหลดคำสั่งทั้งหมดจากโฟลเดอร์ commands
const loadCommands = async () => {
  const commandsPath = path.join(__dirname, 'commands');
  if (!fs.existsSync(commandsPath)) {
    console.log('⚠️ ไม่พบโฟลเดอร์ "commands"');
    return [];
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  if (commandFiles.length === 0) {
    console.log('⚠️ ไม่มีคำสั่งที่สามารถโหลดได้');
    return [];
  }

  return Promise.all(
    commandFiles.map(async (file) => {
      try {
        const command = require(`./commands/${file}`);
        if (command.data && command.execute) {
          client.commands.set(command.data.name, command);
          return command.data.toJSON();
        } else {
          console.warn(`⚠️ ไฟล์ ${file} ไม่มีโครงสร้างคำสั่งที่ถูกต้อง`);
          return null;
        }
      } catch (error) {
        logError(error, `ไม่สามารถโหลดคำสั่งจากไฟล์ ${file}`);
        return null;
      }
    })
  ).then(commands => commands.filter(Boolean)); // กรองคำสั่งที่โหลดได้สำเร็จ
};

// ตั้งสถานะบอทแบบหมุนเวียน
const rotateStatus = () => {
  const statuses = [
    { name: 'เซิร์ฟเวอร์ของคุณ 🛡️', type: ActivityType.Watching },
    { name: 'คำสั่งใหม่ 📜', type: ActivityType.Playing },
    { name: 'เสียงจากสมาชิก 🎧', type: ActivityType.Listening },
    { name: 'การแข่งขันบอท 🤖', type: ActivityType.Competing },
  ];

  let index = 0;
  setInterval(() => {
    client.user.setPresence({
      activities: [statuses[index]],
      status: 'online',
    });
    index = (index + 1) % statuses.length;
  }, 30000);
};

// เมื่อบอทพร้อมใช้งาน
client.once(Events.ClientReady, async () => {
  console.log(`🚀 บอทออนไลน์ในชื่อ ${client.user.tag}`);
  const commands = await loadCommands();
  if (commands.length > 0) {
    try {
      await client.application.commands.set(commands);
      console.log('✅ ลงทะเบียน Slash Commands สำเร็จ');
    } catch (error) {
      logError(error, 'ไม่สามารถลงทะเบียนคำสั่ง Slash');
    }
  }
  rotateStatus();
});

// จัดการ Slash Command
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    logError(error, `เกิดข้อผิดพลาดในคำสั่ง ${interaction.commandName}`);
    await interaction.reply({
      content: '❌ เกิดข้อผิดพลาดในการดำเนินการคำสั่งนี้!',
      ephemeral: true,
    });
  }
});

// ล็อกอิน
client.login(token).catch((error) => {
  logError(error, 'ไม่สามารถล็อกอินบอทได้');
});
