// Shared CORS headers for Edge Functions
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Standard JSON response with CORS
export function jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders,
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
        },
    });
}

// Error response helper
export function errorResponse(message: string, status = 400): Response {
    return jsonResponse({ error: message }, status);
}

// Handle CORS preflight
export function handleCors(req: Request): Response | null {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }
    return null;
}
