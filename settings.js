const fs = require('fs'); 
const path = require('path');

const settingsPath = path.join(__dirname, 'guildSettings.json');

// ฟังก์ชันดึงการตั้งค่าของเซิร์ฟเวอร์
const getGuildSettings = async (guildId) => {
  try {
    // ตรวจสอบว่าไฟล์มีอยู่หรือไม่
    if (!fs.existsSync(settingsPath)) {
      console.log('⚠️ ไฟล์ settings ไม่พบ กำลังสร้างไฟล์ใหม่...');
      // สร้างไฟล์ settings ว่าง ๆ หากไม่พบ
      await fs.promises.writeFile(settingsPath, JSON.stringify({}));
    }

    const data = await fs.promises.readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(data);

    // ตรวจสอบว่ามีการตั้งค่าของ guild นี้หรือไม่ ถ้าไม่มีให้คืนค่าเป็น object ว่าง
    return settings[guildId] || { antiLinkEnabled: false, allowedRoles: [] };
  } catch (error) {
    console.error('Error reading settings:', error);
    return null;
  }
};

// ฟังก์ชันบันทึกการตั้งค่าของเซิร์ฟเวอร์
const saveGuildSettings = async (guildId, settings) => {
  try {
    // ตรวจสอบว่าไฟล์มีอยู่หรือไม่
    if (!fs.existsSync(settingsPath)) {
      console.log('⚠️ ไฟล์ settings ไม่พบ กำลังสร้างไฟล์ใหม่...');
      // สร้างไฟล์ settings ว่าง ๆ หากไม่พบ
      await fs.promises.writeFile(settingsPath, JSON.stringify({}));
    }

    const data = await fs.promises.readFile(settingsPath, 'utf-8');
    const allSettings = JSON.parse(data);

    // อัพเดตการตั้งค่าของ guild ที่ต้องการ
    allSettings[guildId] = settings;

    // เขียนข้อมูลทั้งหมดกลับไปที่ไฟล์
    await fs.promises.writeFile(settingsPath, JSON.stringify(allSettings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

module.exports = { getGuildSettings, saveGuildSettings };
