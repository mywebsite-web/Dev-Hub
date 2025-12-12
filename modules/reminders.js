const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');
const whatsapp = require('./whatsapp');

const reminders = [];
let reminderJobs = new Map();

// Load reminders from file
function loadReminders() {
  try {
    const remindersPath = path.join(__dirname, '../data/reminders.json');
    if (fs.existsSync(remindersPath)) {
      const data = fs.readFileSync(remindersPath, 'utf8');
      const savedReminders = JSON.parse(data);
      reminders.push(...savedReminders);
      
      // Reschedule all reminders
      savedReminders.forEach(reminder => {
        if (reminder.status === 'pending' && new Date(reminder.scheduledTime) > new Date()) {
          scheduleReminder(reminder);
        }
      });
    }
  } catch (error) {
    console.error('Error loading reminders:', error);
  }
}

// Save reminders to file
function saveReminders() {
  try {
    const remindersPath = path.join(__dirname, '../data/reminders.json');
    const remindersDir = path.dirname(remindersPath);
    
    if (!fs.existsSync(remindersDir)) {
      fs.mkdirSync(remindersDir, { recursive: true });
    }
    
    fs.writeFileSync(remindersPath, JSON.stringify(reminders, null, 2));
  } catch (error) {
    console.error('Error saving reminders:', error);
  }
}

// Schedule a reminder
function scheduleReminder(reminder) {
  const scheduledTime = new Date(reminder.scheduledTime);
  
  if (scheduledTime <= new Date()) {
    return {
      success: false,
      message: '❌ Cannot schedule reminder in the past.'
    };
  }

  const job = schedule.scheduleJob(scheduledTime, async () => {
    console.log(`⏰ REMINDER: ${reminder.text}`);
    console.log(`   Scheduled for: ${reminder.scheduledTime}`);
    
    // Update reminder status
    reminder.status = 'completed';
    reminder.completedAt = new Date().toISOString();
    saveReminders();
    
    // Send notifications if configured
    if (reminder.notifyWhatsApp && reminder.whatsappNumber) {
      try {
        await whatsapp.sendWhatsAppMessage(
          reminder.whatsappNumber,
          `⏰ REMINDER: ${reminder.text}`,
          null
        );
      } catch (error) {
        console.error('Error sending WhatsApp reminder:', error);
      }
    }
    
    // Remove job from map
    reminderJobs.delete(reminder.id);
  });

  if (job) {
    reminderJobs.set(reminder.id, job);
    return {
      success: true,
      message: `✅ Reminder scheduled for ${scheduledTime.toLocaleString()}`
    };
  } else {
    return {
      success: false,
      message: '❌ Failed to schedule reminder.'
    };
  }
}

// Create a new reminder
function createReminder(dateTimeString, reminderText, options = {}) {
  try {
    const scheduledTime = new Date(dateTimeString);
    
    if (isNaN(scheduledTime.getTime())) {
      return {
        success: false,
        message: '❌ Invalid date/time format. Use: YYYY-MM-DD HH:mm'
      };
    }

    if (scheduledTime <= new Date()) {
      return {
        success: false,
        message: '❌ Cannot schedule reminder in the past.'
      };
    }

    const reminder = {
      id: 'rem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      text: reminderText,
      scheduledTime: scheduledTime.toISOString(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      notifyWhatsApp: options.notifyWhatsApp || false,
      whatsappNumber: options.whatsappNumber || null,
      notifyEmail: options.notifyEmail || false,
      emailAddress: options.emailAddress || null
    };

    reminders.push(reminder);
    saveReminders();

    const scheduleResult = scheduleReminder(reminder);
    
    if (scheduleResult.success) {
      return {
        success: true,
        message: `✅ Reminder created!\n\n` +
                 `Text: ${reminderText}\n` +
                 `Scheduled for: ${scheduledTime.toLocaleString()}\n` +
                 `Reminder ID: ${reminder.id}`,
        reminderId: reminder.id
      };
    } else {
      return scheduleResult;
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ Error creating reminder: ${error.message}`
    };
  }
}

// Get all reminders
function getReminders(status = 'all') {
  let filtered = reminders;
  
  if (status === 'pending') {
    filtered = reminders.filter(r => r.status === 'pending');
  } else if (status === 'completed') {
    filtered = reminders.filter(r => r.status === 'completed');
  }
  
  return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Cancel a reminder
function cancelReminder(reminderId) {
  const reminder = reminders.find(r => r.id === reminderId);
  
  if (!reminder) {
    return {
      success: false,
      message: '❌ Reminder not found.'
    };
  }

  if (reminder.status === 'completed') {
    return {
      success: false,
      message: '❌ Cannot cancel a completed reminder.'
    };
  }

  const job = reminderJobs.get(reminderId);
  if (job) {
    job.cancel();
    reminderJobs.delete(reminderId);
  }

  reminder.status = 'cancelled';
  reminder.cancelledAt = new Date().toISOString();
  saveReminders();

  return {
    success: true,
    message: `✅ Reminder cancelled: ${reminder.text}`
  };
}

// Initialize on module load
loadReminders();

module.exports = {
  createReminder,
  getReminders,
  cancelReminder
};

