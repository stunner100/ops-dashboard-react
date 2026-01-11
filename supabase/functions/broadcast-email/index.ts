/// <reference lib="deno.ns" />

import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, createSupabaseAdmin } from '../_shared/supabase.ts';

const RESEND_API_URL = 'https://api.resend.com/emails';
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 10000;
const SEND_BATCH_SIZE = 10;

type SendResult = { ok: true } | { ok: false; error: string };

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => {
        switch (char) {
            case '&':
                return '&amp;';
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '"':
                return '&quot;';
            case "'":
                return '&#39;';
            default:
                return char;
        }
    });
}

function buildHtml(message: string): string {
    const safe = escapeHtml(message).replace(/\n/g, '<br />');
    return `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #111827;">${safe}</div>`;
}

async function sendResendEmail(
    apiKey: string,
    from: string,
    to: string,
    subject: string,
    text: string,
    html: string
): Promise<SendResult> {
    const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject,
            text,
            html,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        return { ok: false, error: errorText || 'Resend request failed' };
    }

    return { ok: true };
}

async function loadAllEmails() {
    const supabaseAdmin = createSupabaseAdmin();
    const emails: string[] = [];
    const pageSize = 1000;
    let from = 0;

    while (true) {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('email')
            .range(from, from + pageSize - 1);

        if (error) throw error;

        const pageEmails = (data || [])
            .map((row: { email: string | null }) => row.email)
            .filter((email): email is string => typeof email === 'string' && email.length > 0);

        emails.push(...pageEmails);

        if (!data || data.length < pageSize) break;
        from += pageSize;
    }

    return Array.from(new Set(emails));
}

async function requireAdmin(authHeader: string) {
    const supabase = createSupabaseClient(authHeader);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('Unauthorized');
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || profile?.role !== 'admin') {
        throw new Error('Admin access required');
    }
}

Deno.serve(async (req) => {
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    if (req.method !== 'POST') {
        return errorResponse('Method not allowed', 405);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return errorResponse('No authorization header', 401);
    }

    let payload: { subject?: string; message?: string } | null = null;
    try {
        payload = await req.json();
    } catch {
        return errorResponse('Invalid JSON payload', 400);
    }

    const subject = payload?.subject?.trim() || '';
    const message = payload?.message?.trim() || '';

    if (!subject || !message) {
        return errorResponse('Subject and message are required', 400);
    }

    if (subject.length > MAX_SUBJECT_LENGTH) {
        return errorResponse('Subject is too long', 400);
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
        return errorResponse('Message is too long', 400);
    }

    try {
        await requireAdmin(authHeader);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unauthorized';
        const status = message === 'Unauthorized' ? 401 : 403;
        return errorResponse(message, status);
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL');

    if (!resendApiKey || !resendFromEmail) {
        return errorResponse('Email provider not configured', 500);
    }

    try {
        const recipients = await loadAllEmails();

        if (recipients.length === 0) {
            return errorResponse('No recipients found', 400);
        }

        const html = buildHtml(message);
        let sent = 0;
        let failed = 0;

        for (let i = 0; i < recipients.length; i += SEND_BATCH_SIZE) {
            const batch = recipients.slice(i, i + SEND_BATCH_SIZE);
            const results = await Promise.all(
                batch.map((email) => sendResendEmail(resendApiKey, resendFromEmail, email, subject, message, html))
            );

            results.forEach((result) => {
                if (result.ok) {
                    sent += 1;
                } else {
                    failed += 1;
                    console.warn('Broadcast email failed:', result.error);
                }
            });
        }

        return jsonResponse({
            sent,
            failed,
            total: recipients.length,
        });
    } catch (error) {
        console.error('Broadcast email error:', error);
        return errorResponse(error instanceof Error ? error.message : 'Failed to send emails', 500);
    }
});
