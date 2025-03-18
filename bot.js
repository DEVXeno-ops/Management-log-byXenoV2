require('dotenv').config();  // Ensure dotenv is imported

const { Client, GatewayIntentBits, Events, Collection, ActivityType } = require('discord.js');
const { getGuildSettings, saveGuildSettings } = require('./settings');  // นำเข้าจากไฟล์ settings.js
const fs = require('fs');
const path = require('path');

// Initialize the client with necessary intents
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
const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error('❌ DISCORD_TOKEN not found in .env file');
  process.exit(1);  // Exit the application if token is not provided
}

// Error logging function
const logError = (error, context) => {
  console.error('❌ ข้อผิดพลาดเกิดขึ้น:', context);
  console.error('ข้อความผิดพลาด:', error.message);
  console.error('Stack trace:', error.stack);
};

// Load commands from the 'commands' directory
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

  const commands = [];
  for (const file of commandFiles) {
    try {
      const command = require(`./commands/${file}`);
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
      } else {
        console.warn(`⚠️ ไฟล์ ${file} ไม่มีโครงสร้างคำสั่งที่ถูกต้อง`);
      }
    } catch (error) {
      logError(error, `ไม่สามารถโหลดคำสั่งจากไฟล์ ${file}`);
    }
  }
  return commands;
};

// Rotate bot's status
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
  }, 30000);  // Update status every 30 seconds
};

// When the bot is ready
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
  } else {
    console.log('⚠️ ไม่มีคำสั่ง Slash ให้ลงทะเบียน');
  }
  rotateStatus();
});

// Handle Slash Commands and Button Interactions
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) {
        try {
          await command.execute(interaction);
        } catch (error) {
          console.error('Error executing command:', error);
          await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการทำงานของคำสั่ง', ephemeral: true });
        }
      }
    }

    if (interaction.isButton()) {
      const customId = interaction.customId;

      // ตรวจสอบเฉพาะปุ่มที่เกี่ยวข้องกับคำสั่ง unban
      if (customId.startsWith('unban_confirm_')) {
        const unbanCommand = client.commands.get('unban');
        if (unbanCommand && unbanCommand.handleInteraction) {
          try {
            await unbanCommand.handleInteraction(interaction);
          } catch (error) {
            console.error('Error handling button interaction:', error);
            await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการยกเลิกการแบน', ephemeral: true });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการทำงานกับ Interaction', ephemeral: true });
  }
});

// Log in with the bot token
client.login(token).catch((error) => {
  logError(error, 'ไม่สามารถล็อกอินบอทได้');
});
