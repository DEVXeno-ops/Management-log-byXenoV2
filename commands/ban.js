const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
  } = require('discord.js');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('แบนผู้ใช้จากเซิร์ฟเวอร์ (เฉพาะเจ้าของหรือแอดมิน)')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('เลือกผู้ใช้ที่ต้องการแบน')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('reason')
          .setDescription('เหตุผลในการแบน')
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'ไม่ระบุเหตุผล';
      let member;
  
      try {
        member = await interaction.guild.members.fetch(user.id);
      } catch (error) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('❌ ไม่พบผู้ใช้')
              .setDescription('ไม่สามารถดึงข้อมูลผู้ใช้จากเซิร์ฟเวอร์ได้!')
          ],
          ephemeral: true
        });
      }
  
      const executor = interaction.member; // ผู้ใช้ที่ใช้คำสั่ง
  
      // Role ที่มีสิทธิ์แบน (ต้องกำหนดเอง)
      const adminRoleIds = ['ROLE_ID_1', 'ROLE_ID_2']; // ใส่ ID ของ Role ที่ต้องการให้แบนได้
  
      // เช็คว่าผู้ใช้เป็นเจ้าของเซิร์ฟเวอร์หรือมี Role แอดมิน
      const isOwner = executor.id === interaction.guild.ownerId;
      const isAdmin = executor.roles.cache.some(role => adminRoleIds.includes(role.id));
  
      if (!isOwner && !isAdmin) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('🚫 คุณไม่มีสิทธิ์ใช้คำสั่งนี้')
              .setDescription('เฉพาะเจ้าของเซิร์ฟเวอร์หรือแอดมินเท่านั้นที่สามารถใช้คำสั่งนี้')
          ],
          ephemeral: true
        });
      }
  
      // เช็คว่าผู้ใช้เป้าหมายอยู่ในเซิร์ฟเวอร์หรือไม่
      if (!member) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('❌ ไม่พบผู้ใช้')
              .setDescription('ผู้ใช้ที่คุณเลือกไม่อยู่ในเซิร์ฟเวอร์นี้!')
          ],
          ephemeral: true
        });
      }
  
      // ป้องกันไม่ให้แบนเจ้าของเซิร์ฟเวอร์
      if (member.id === interaction.guild.ownerId) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('DarkRed')
              .setTitle('⛔ ไม่สามารถแบนเจ้าของเซิร์ฟเวอร์ได้!')
          ],
          ephemeral: true
        });
      }
  
      // ป้องกันการแบนแอดมินคนอื่นที่มี Role ในรายการ
      if (member.roles.cache.some(role => adminRoleIds.includes(role.id))) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('Orange')
              .setTitle('⚠️ ไม่สามารถแบนผู้ใช้คนนี้ได้')
              .setDescription('ผู้ใช้มีสิทธิ์แอดมินและได้รับการป้องกันจากการแบน')
          ],
          ephemeral: true
        });
      }
  
      // ป้องกันการแบนตัวเอง
      if (member.id === executor.id) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('Orange')
              .setTitle('⚠️ คุณไม่สามารถแบนตัวเองได้!')
          ],
          ephemeral: true
        });
      }
  
      // เช็คสิทธิ์ของบอท
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('⚠️ บอทไม่มีสิทธิ์แบน')
              .setDescription('โปรดให้สิทธิ์ **Ban Members** แก่บอท')
          ],
          ephemeral: true
        });
      }
  
      // ตรวจสอบว่าบอทมีสิทธิ์แบนผู้ที่มีสถานะสูงกว่า
      if (executor.roles.highest.position <= member.roles.highest.position && interaction.guild.members.me.roles.highest.position <= member.roles.highest.position) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('⛔ คุณไม่สามารถแบนผู้ใช้ที่มีสถานะสูงกว่าคุณได้!')
          ],
          ephemeral: true
        });
      }
  
      // สร้าง Embed แจ้งเตือน
      const banEmbed = new EmbedBuilder()
        .setColor('DarkRed')
        .setTitle('🚨 ผู้ใช้ถูกแบน 🚨')
        .setDescription(`**${user.tag}** ถูกแบนจากเซิร์ฟเวอร์`)
        .addFields(
          { name: '👤 ผู้ใช้', value: `<@${user.id}>`, inline: true },
          { name: '🛑 เหตุผล', value: reason, inline: true },
          { name: '🔨 ดำเนินการโดย', value: `<@${executor.id}>`, inline: false }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ text: 'Ban System', iconURL: interaction.client.user.displayAvatarURL() });
  
      // สร้างปุ่ม "ยืนยันแบน" และ "ยกเลิก"
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_ban')
          .setLabel('✅ ยืนยันแบน')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_ban')
          .setLabel('❌ ยกเลิก')
          .setStyle(ButtonStyle.Secondary)
      );
  
      // ส่งข้อความยืนยันก่อนแบน
      const response = await interaction.reply({ embeds: [banEmbed], components: [row], ephemeral: true });
  
      // รอการกดปุ่ม
      const filter = i => i.user.id === executor.id;
      const collector = response.createMessageComponentCollector({ filter, time: 15000 });
  
      collector.on('collect', async i => {
        if (i.customId === 'confirm_ban') {
          try {
            // ส่ง DM แจ้งเตือนผู้ใช้ก่อนแบน
            await user.send({
              embeds: [
                new EmbedBuilder()
                  .setColor('DarkRed')
                  .setTitle('🚨 **คุณถูกแบนจากเซิร์ฟเวอร์!** 🚨')
                  .setDescription(`**${user.tag}** คุณถูกแบนจากเซิร์ฟเวอร์ **${interaction.guild.name}** เนื่องจากเหตุผลที่ระบุด้านล่าง`)
                  .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                  .addFields(
                    { name: '🛑 **เหตุผล**', value: `**${reason}**`, inline: false },
                    { name: '🔨 **ดำเนินการโดย**', value: `<@${executor.id}>`, inline: false },
                    { name: '📅 **เวลาแบน**', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false },
                    { name: '📝 **ติดต่อปลอดแบน**', value: 'กรุณาติดต่อผู้ดูแลเซิร์ฟเวอร์เพื่อขอความช่วยเหลือในการยกเลิกแบน.', inline: false }
                  )
                  .setFooter({ 
                    text: 'Ban System • โปรดระวังการกระทำในเซิร์ฟเวอร์', 
                    iconURL: interaction.client.user.displayAvatarURL() 
                  })
                  .setTimestamp()
                  .setImage('https://your-image-link-here.com')  // เพิ่มภาพพื้นหลังหรือลิงค์ภาพ
              ]
            }).catch(() => console.log(`❌ ไม่สามารถส่ง DM ถึง ${user.tag} ได้`));
  
            // ดำเนินการแบน
            await member.ban({ reason });
  
            // ส่ง Embed อัปเดตสถานะแบน
            await i.update({
              embeds: [banEmbed.setDescription(`✅ **${user.tag}** ถูกแบนเรียบร้อย!`)],
              components: []
            });
  
            // แจ้งเตือนในแชนแนล logs
            const logChannel = interaction.guild.channels.cache.find(c => c.name === 'mod-logs');
            if (logChannel) {
              logChannel.send({ embeds: [banEmbed] });
            } else {
              console.log('ไม่พบแชนแนล mod-logs');
            }
          } catch (error) {
            console.error('เกิดข้อผิดพลาดขณะพยายามแบน:', error);
            await i.update({ content: '❌ เกิดข้อผิดพลาดขณะพยายามแบนผู้ใช้!', components: [] });
          }
        } else if (i.customId === 'cancel_ban') {
          await i.update({
            embeds: [
              new EmbedBuilder()
                .setColor('Green')
                .setTitle('✅ ยกเลิกการแบน')
                .setDescription(`คำสั่งแบนของ **${user.tag}** ถูกยกเลิก`)
            ],
            components: []
          });
        }
      });
  
      collector.on('end', async () => {
        try {
          await interaction.editReply({ components: [] });
        } catch (error) {
          console.error('ไม่สามารถอัปเดตข้อความได้:', error);
        }
      });
    }
  };
  