-- Simplified migration to update existing task assignment notifications
-- Run this in the Supabase SQL Editor

-- First, let's see what notifications exist (uncomment to debug):
-- SELECT id, title, description, link FROM notifications WHERE title = 'You have been assigned a task';

-- Update all task assignment notifications with enhanced format
UPDATE notifications n
SET 
    title = '� New Task Assignment',
    description = (
        SELECT 
            '� ' || t.title || E'\n' ||
            '📁 Category: ' || 
            CASE t.category
                WHEN 'vendor_ops' THEN 'Vendor Ops'
                WHEN 'rider_fleet' THEN 'Rider Fleet'
                WHEN 'customer_service' THEN 'Customer Service'
                WHEN 'business_development' THEN 'Business Development'
                WHEN 'dashboard_support' THEN 'Dashboard Support'
                ELSE COALESCE(t.category, 'Unknown')
            END || E'\n' ||
            '⚡ Priority: ' || 
            CASE t.priority
                WHEN 'low' THEN '� Low'
                WHEN 'medium' THEN '🟡 Medium'
                WHEN 'high' THEN '🟠 High'
                WHEN 'critical' THEN '🔴 Critical'
                ELSE '🟡 Medium'
            END ||
            CASE 
                WHEN t.due_date IS NOT NULL THEN 
                    E'\n📅 Due: ' || TO_CHAR(t.due_date, 'Dy, Mon DD') ||
                    CASE 
                        WHEN t.due_date > CURRENT_DATE THEN ' (' || (t.due_date - CURRENT_DATE) || 'd remaining)'
                        WHEN t.due_date = CURRENT_DATE THEN ' (Due today!)'
                        ELSE ' (Overdue!)'
                    END
                ELSE ''
            END ||
            CASE 
                WHEN t.description IS NOT NULL AND t.description != '' THEN E'\n\n' || t.description
                ELSE ''
            END
        FROM tasks t
        WHERE t.id::TEXT = REPLACE(n.link, '/?task=', '')
    )
WHERE n.title = 'You have been assigned a task'
AND n.link LIKE '/?task=%';

-- Show how many were updated
-- SELECT COUNT(*) as updated_count FROM notifications WHERE title = '📌 New Task Assignment';
