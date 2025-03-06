require('dotenv').config();
const { Client, GatewayIntentBits, Events, Collection } = require('discord.js');
const fs = require('fs');

// สร้าง client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
  ],
});

// เก็บคำสั่งใน Collection
client.commands = new Collection();

const token = process.env.DISCORD_TOKEN;

// เมื่อบอทพร้อมใช้งาน
client.once(Events.ClientReady, async () => {
  console.log(`ล็อกอินสำเร็จในชื่อ ${client.user.tag}`);

  // โหลดคำสั่งจากโฟลเดอร์ 'commands'
  const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

  if (commandFiles.length === 0) {
    console.log('ไม่พบคำสั่งในโฟลเดอร์ "commands"');
  }

  const commands = [];

  for (const file of commandFiles) {
    try {
      const command = require(`./commands/${file}`);
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON()); // เก็บคำสั่งเป็น JSON สำหรับลงทะเบียนกับ Discord API
      console.log(`โหลดคำสั่ง ${command.data.name} สำเร็จ`);
    } catch (error) {
      console.error(`ไม่สามารถโหลดคำสั่งจากไฟล์ ${file}:`, error);
    }
  }

  // ลงทะเบียนคำสั่งทั้งหมดกับ Discord API
  try {
    await client.application.commands.set(commands);
    console.log('ลงทะเบียน Slash Commands สำเร็จ');
  } catch (error) {
    console.error('ไม่สามารถลงทะเบียนคำสั่ง Slash:', error);
  }
});

// จัดการ Slash Command
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (command) {
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'เกิดข้อผิดพลาดในการดำเนินการคำสั่งนี้!',
        ephemeral: true,
      });
    }
  }
});

// ล็อกอิน
client.login(token);
