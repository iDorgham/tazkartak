const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Free tier backup - uses Railway volumes instead of AWS S3
const backupDatabase = async () => {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = `backup-${timestamp}.sql`;
  const backupDir = path.join(process.cwd(), 'backups');
  const filepath = path.join(backupDir, filename);

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Export database
  const command = `pg_dump ${process.env.DATABASE_URL} > ${filepath}`;
  
  exec(command, async (error) => {
    if (error) {
      console.error('Backup failed:', error);
      return;
    }

    console.log('Backup completed:', filename);

    // Optional: Upload to AWS S3 if credentials are provided
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.BACKUP_BUCKET_NAME) {
      try {
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'eu-west-1',
        });

        const fileContent = fs.readFileSync(filepath);
        await s3.putObject({
          Bucket: process.env.BACKUP_BUCKET_NAME,
          Key: `database/${filename}`,
          Body: fileContent,
        }).promise();

        console.log('Backup uploaded to S3:', filename);
      } catch (s3Error) {
        console.warn('S3 upload failed, backup saved locally:', s3Error.message);
      }
    }

    // Clean up old backups (keep last 7 days)
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    files.forEach(file => {
      if (file.endsWith('.sql')) {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        if (stats.mtime.getTime() < sevenDaysAgo) {
          fs.unlinkSync(filePath);
          console.log('Deleted old backup:', file);
        }
      }
    });
  });
};

backupDatabase();
