-- Seed detailed SOP documents from project files
-- Customer Service SOP, Vendor SOP, and Rider SOP

-- Customer Service SOP
INSERT INTO public.sop_documents (title, description, department, status)
VALUES (
    'Customer Service SOP',
    'Standardized guidelines for handling customer interactions to ensure consistent, professional, and efficient customer support across all approved communication channels.',
    'customer_service',
    'active'
) ON CONFLICT DO NOTHING;

-- Add Customer Service sections
WITH doc AS (SELECT id FROM sop_documents WHERE title = 'Customer Service SOP' LIMIT 1)
INSERT INTO sop_sections (document_id, title, content, order_index)
SELECT doc.id, s.title, s.content, s.order_index FROM doc, (VALUES
    ('Purpose', 'This document provides standardized guidelines for handling customer interactions to ensure consistent, professional, and efficient customer support across all approved communication channels.', 1),
    ('Scope', 'Applies to: Customer Service Agents, Interns, Supervisors, Managers, and any staff handling customer issues.', 2),
    ('Communication Channels', 'In-app chat (Tawk.to), Phone calls, Email, WhatsApp. Working hours: 8:00am – 9:00pm', 3),
    ('Service Level Agreements', 'Chat: First Response ≤5 minutes, Resolution ≤3 hours. Calls: 1-2 mins response, 5 mins resolution. Email: ≤1 hour response, ≤48 hours resolution.', 4),
    ('Issue Categories', 'All tickets must be logged under: Order delays, Wrong or missing items, Refund requests, Payment issues, Vendor unavailable, Rider issues, App or chat issues, General inquiries.', 5),
    ('Standard Issue Handling', 'Step 1: Receive & confirm customer details. Step 2: Investigate system status, payment records, contact vendor/rider. Step 3: Resolve by applying company policy or escalate. Step 4: Close by confirming resolution and documenting outcome.', 6),
    ('Refund & Cancellation Policy', 'Explains when refunds are allowed, approval authority, timelines, and how to communicate refund status to customers.', 7),
    ('Escalation Matrix', 'Payment failure → Tech (48 hours). Vendor dispute → Operations (Same day). Angry customer → Relevant Stakeholder (Immediate).', 8),
    ('Data Privacy', 'Customer data must be protected at all times. Sharing customer details, screenshots, or internal data externally is prohibited.', 9)
) AS s(title, content, order_index)
ON CONFLICT DO NOTHING;

-- Vendor Account Management SOP
INSERT INTO public.sop_documents (title, description, department, status)
VALUES (
    'Vendor Account Management SOP',
    'Complete standard operating procedure for vendor account management including performance standards, onboarding, complaint handling, promotions, and service agreements.',
    'vendor',
    'active'
) ON CONFLICT DO NOTHING;

-- Add Vendor sections
WITH doc AS (SELECT id FROM sop_documents WHERE title = 'Vendor Account Management SOP' LIMIT 1)
INSERT INTO sop_sections (document_id, title, content, order_index)
SELECT doc.id, s.title, s.content, s.order_index FROM doc, (VALUES
    ('Business Model & Scope', 'Area: Accra Community & UPSA. Vendor types: Restaurants, Street food/home vendors, Grocery vendors, Pharmacies. Operating hours: 8am-11pm.', 1),
    ('Performance Standards & KPIs', 'Rating thresholds: 4.0. Prep time: Within 3 minutes. Acceptance SLA: Within 2 minutes. Cancellation threshold: <10/day. Complaint rate: 5/day.', 2),
    ('Vendor Rating & Quality Rules', 'Target Rating: ≥4.3. Watch: 4.0-4.29. Critical: Below 4.0. Daily monitoring, weekly categorization (Green/Amber/Red), action plans for low-rated vendors.', 3),
    ('Communication & Escalation', 'Channels: WhatsApp, Phone Calls, SMS, In-app (Tawk). Escalation levels: Vendor Account Manager → Operations Lead → Senior Management.', 4),
    ('Customer Complaint Handling', 'Sources: Support tickets, In-app chat, Phone, WhatsApp. Vendor notified within 24 hours. Response required: 2 hours (urgent), 24 hours (standard).', 5),
    ('Refund & Compensation Policy', 'Vendor fault: Vendor bears refund/replacement cost. Options: Full/partial refund, Meal credits/vouchers, Replacement order.', 6),
    ('Product Development', '9-step process: Customer surveys → Feedback evaluation → Vendor communication → Product development → Pre-launch announcements → Launch promos → Post-launch feedback.', 7),
    ('Vendor Onboarding', 'Agreement to Terms → Information Submission (Google Form) → Account Creation → Shop Inspection → Training and Orientation.', 8),
    ('Vendor App Training', 'Account login, Order processing, Preparation workflow, Awaiting pickup, Order completion, Rider requests, Ratings & reviews, Withdrawals, Item management.', 9),
    ('Promotions & Advertising', 'Types: Free Delivery, Fee Discounts, Product Discounts, Checkout Discounts, New Vendor Launch, Trending Boost, Time-Based, Re-engagement, Seasonal campaigns.', 10),
    ('Types of Vendor Accounts', 'App Vendors: Use app for orders, courier requests, withdrawals, settings. Manual Vendors: Account managers handle processes, vendor only prepares orders.', 11),
    ('Service Agreement', 'Core responsibilities for Abonten Technologies and Vendors. Health and food safety standards. Order processing within 5 minutes. Delivery within 35 minutes.', 12)
) AS s(title, content, order_index)
ON CONFLICT DO NOTHING;

-- Comprehensive Rider SOP
INSERT INTO public.sop_documents (title, description, department, status)
VALUES (
    'Comprehensive Rider Standard Operating Procedures',
    'Complete rider management SOP covering onboarding, performance standards, payment and settlement, order management, incentive programs, and daily monitoring.',
    'rider',
    'active'
) ON CONFLICT DO NOTHING;

-- Add Rider sections
WITH doc AS (SELECT id FROM sop_documents WHERE title = 'Comprehensive Rider Standard Operating Procedures' LIMIT 1)
INSERT INTO sop_sections (document_id, title, content, order_index)
SELECT doc.id, s.title, s.content, s.order_index FROM doc, (VALUES
    ('Rider Onboarding Process', 'Required documents: Ghana Card, ID, bike ownership, power bank (10,000mAh), smartphone. Eligibility: 18+ years, valid license (motor), 5% commission agreement. Training: Orientation, App training, Field training, 2-week probation.', 1),
    ('Performance Standards & Metrics', 'Acceptance rate: Min 85%, Target 90%. Cancellation: Max 5%. Delivery time: Campus 10-35min, Community 30-45min. Customer rating: Min 4.2, Target 4.5. Response time: 30 seconds to accept.', 2),
    ('Payment & Settlement', 'Commission: 5% of delivery fee. Daily withdrawal after 11 PM (if zero debt). Weekly default for others. Settlement within 24 hours for cash orders. Warning at GH₵150 debt, suspension at GH₵200.', 3),
    ('Order Acceptance Protocol', 'Accept/reject within 30 seconds. Valid rejections: Outside zone, max capacity, safety concerns, end of shift. Invalid: Customer preference, distance, low fee.', 4),
    ('Order Execution Steps', 'Step 1: Accept & review (0-1 min). Step 2: Vendor pickup (1-15 min) - call vendor, verify order, mark picked up. Step 3: Transit (15-30 min). Step 4: Customer delivery (30-35 min). Step 5: Post-delivery settlement.', 5),
    ('Customer Unavailability Protocol', '15-minute wait rule: 3 phone calls (3 min each), WhatsApp message (2 min), WhatsApp call (2 min), SMS (2 min). After 15 min: Contact manager, return to vendor if needed (50% fee paid).', 6),
    ('Cash vs Mobile Money Orders', 'Cash: Collect exact payment, settle within 24 hours. Mobile Money: Pre-collected, verify "Paid" status, no cash collection needed.', 7),
    ('Incentive Programs', 'Daily: Morning (8-12 orders = GH₵20-40), Afternoon (10-15 = GH₵25-50), Evening (12-18 = GH₵30-60), All-Day (25+ = GH₵100). Weekly: Consistency, Speed, Customer Favorite. Monthly: Top Rider GH₵200.', 8),
    ('Daily Monitoring Schedule', 'Morning (6AM-12PM): Settlement verification, availability assessment, zonal positioning. Afternoon (12PM-5PM): Peak preparation, battery/activity monitoring. Evening (5PM-11PM): Rush coverage, fatigue monitoring, shift closure.', 9),
    ('Problem Escalation', 'When to contact manager: Wrong order, damaged food, unreachable customer, safety concerns, payment disputes, app malfunction. How: Call immediately, explain calmly, provide order number, follow instructions.', 10)
) AS s(title, content, order_index)
ON CONFLICT DO NOTHING;
