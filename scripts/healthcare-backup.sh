#!/bin/bash
# HIPAA-Compliant Healthcare Database Backup Script
# APCTC Healthcare Provider Portal
# Retention: 7 years (2555 days) as required by HIPAA

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
LOG_FILE="/backups/backup.log"
ENCRYPTION_KEY_FILE="/backup-keys/encryption.key"
RETENTION_DAYS=2555  # 7 years
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PREFIX="apctc_healthcare_backup"

# Database connection parameters
DB_HOST="${DB_HOST:-postgres-healthcare}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-apctc_healthcare}"
DB_USER="${DB_USER:-postgres}"

# Logging function
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
    log_message "ERROR: Healthcare backup failed at line $1"
    exit 1
}

trap 'handle_error $LINENO' ERR

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/audit-logs"
mkdir -p "$BACKUP_DIR/phi-documents"

log_message "Starting HIPAA-compliant healthcare backup process"

# 1. Create database backup with PHI protection
log_message "Creating encrypted database backup..."
pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=custom \
    --compress=9 \
    --no-password \
    --file="$BACKUP_DIR/database/${BACKUP_PREFIX}_${DATE}.dump"

# 2. Encrypt the database backup
log_message "Encrypting database backup with AES-256..."
openssl enc -aes-256-cbc \
    -salt \
    -in "$BACKUP_DIR/database/${BACKUP_PREFIX}_${DATE}.dump" \
    -out "$BACKUP_DIR/database/${BACKUP_PREFIX}_${DATE}.dump.enc" \
    -pass file:"$ENCRYPTION_KEY_FILE"

# Remove unencrypted backup
rm "$BACKUP_DIR/database/${BACKUP_PREFIX}_${DATE}.dump"

# 3. Create audit log backup
log_message "Backing up audit logs..."
if [ -d "/app/logs/audit" ]; then
    tar -czf "$BACKUP_DIR/audit-logs/audit_logs_${DATE}.tar.gz" \
        -C "/app/logs" audit/

    # Encrypt audit logs
    openssl enc -aes-256-cbc \
        -salt \
        -in "$BACKUP_DIR/audit-logs/audit_logs_${DATE}.tar.gz" \
        -out "$BACKUP_DIR/audit-logs/audit_logs_${DATE}.tar.gz.enc" \
        -pass file:"$ENCRYPTION_KEY_FILE"

    rm "$BACKUP_DIR/audit-logs/audit_logs_${DATE}.tar.gz"
fi

# 4. Backup PHI documents (if any stored locally)
log_message "Backing up PHI documents..."
if [ -d "/app/uploads/phi-documents" ]; then
    tar -czf "$BACKUP_DIR/phi-documents/phi_docs_${DATE}.tar.gz" \
        -C "/app/uploads" phi-documents/

    # Encrypt PHI documents
    openssl enc -aes-256-cbc \
        -salt \
        -in "$BACKUP_DIR/phi-documents/phi_docs_${DATE}.tar.gz" \
        -out "$BACKUP_DIR/phi-documents/phi_docs_${DATE}.tar.gz.enc" \
        -pass file:"$ENCRYPTION_KEY_FILE"

    rm "$BACKUP_DIR/phi-documents/phi_docs_${DATE}.tar.gz"
fi

# 5. Create backup manifest with checksums
log_message "Creating backup manifest..."
MANIFEST_FILE="$BACKUP_DIR/manifest_${DATE}.txt"
{
    echo "APCTC Healthcare Backup Manifest"
    echo "Backup Date: $(date)"
    echo "Backup Type: HIPAA-Compliant Full Backup"
    echo "Retention: 7 years (HIPAA requirement)"
    echo "Encryption: AES-256-CBC"
    echo ""
    echo "Files:"
} > "$MANIFEST_FILE"

# Add checksums for all backup files
for file in "$BACKUP_DIR"/*/*.enc; do
    if [ -f "$file" ]; then
        checksum=$(sha256sum "$file" | cut -d' ' -f1)
        filesize=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "unknown")
        echo "$(basename "$file"): $checksum ($filesize bytes)" >> "$MANIFEST_FILE"
    fi
done

# 6. Encrypt the manifest
openssl enc -aes-256-cbc \
    -salt \
    -in "$MANIFEST_FILE" \
    -out "${MANIFEST_FILE}.enc" \
    -pass file:"$ENCRYPTION_KEY_FILE"

rm "$MANIFEST_FILE"

# 7. Verify backup integrity
log_message "Verifying backup integrity..."
VERIFICATION_PASSED=true

for encrypted_file in "$BACKUP_DIR"/*/*.enc; do
    if [ -f "$encrypted_file" ]; then
        # Test decryption without actually decrypting
        if ! openssl enc -aes-256-cbc -d \
            -in "$encrypted_file" \
            -pass file:"$ENCRYPTION_KEY_FILE" \
            -out /dev/null 2>/dev/null; then
            log_message "ERROR: Backup verification failed for $encrypted_file"
            VERIFICATION_PASSED=false
        fi
    fi
done

if [ "$VERIFICATION_PASSED" = true ]; then
    log_message "Backup verification successful"
else
    log_message "ERROR: Backup verification failed"
    exit 1
fi

# 8. Clean up old backups (7-year retention)
log_message "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "*.enc" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -type f -name "manifest_*.txt.enc" -mtime +$RETENTION_DAYS -delete

# 9. Log backup completion
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log_message "Healthcare backup completed successfully"
log_message "Total backup size: $BACKUP_SIZE"
log_message "Backup location: $BACKUP_DIR"
log_message "Retention period: $RETENTION_DAYS days (7 years)"

# 10. Create backup summary for compliance reporting
SUMMARY_FILE="$BACKUP_DIR/backup_summary_${DATE}.json"
{
    echo "{"
    echo "  \"backup_date\": \"$(date -Iseconds)\","
    echo "  \"backup_type\": \"HIPAA_COMPLIANT_FULL\","
    echo "  \"retention_days\": $RETENTION_DAYS,"
    echo "  \"encryption\": \"AES-256-CBC\","
    echo "  \"verification_status\": \"PASSED\","
    echo "  \"total_size\": \"$BACKUP_SIZE\","
    echo "  \"compliance_framework\": \"HIPAA\","
    echo "  \"data_classification\": \"PHI\","
    echo "  \"backup_components\": ["
    echo "    \"database\","
    echo "    \"audit_logs\","
    echo "    \"phi_documents\""
    echo "  ]"
    echo "}"
} > "$SUMMARY_FILE"

# Encrypt the summary
openssl enc -aes-256-cbc \
    -salt \
    -in "$SUMMARY_FILE" \
    -out "${SUMMARY_FILE}.enc" \
    -pass file:"$ENCRYPTION_KEY_FILE"

rm "$SUMMARY_FILE"

log_message "HIPAA-compliant backup process completed successfully"

# Exit with success
exit 0