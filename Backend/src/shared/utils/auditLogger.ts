import AuditLog from '../database/models/auditLogModel';
import logger from './logger';

export interface AuditLogParams {
    action: string;
    module: string;
    entityId?: string;
    entityType?: string;
    performedBy: string;
    severity?: 'info' | 'warning' | 'critical';
    status?: 'success' | 'failed';
    message: string;
    metadata?: {
        ip?: string;
        device?: string;
        location?: string;
        userAgent?: string;
    };
    changes?: any;
}

/**
 * Enterprise Audit Telemetry Logging Engine
 * Creates audit trails in MongoDB and instantly broadcasts to real-time streams over Socket.io
 */
export const logAudit = async (params: AuditLogParams) => {
    try {
        const log = await AuditLog.log(params);
        logger.info(`[SIEM AUDIT] [${params.severity || 'info'}] [${params.module}] ${params.action} by ${params.performedBy}: ${params.message}`);
        return log;
    } catch (err: any) {
        logger.error(`[SIEM AUDIT ERROR] Failed to record audit log trail: ${err.message}`);
    }
};
