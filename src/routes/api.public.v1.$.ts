import { createFileRoute } from '@tanstack/react-router';

async function handle({ request, params }: { request: Request; params: { _splat?: string } }) {
  const { handleApi } = await import('@/lib/public-api.server');
  try {
    return await handleApi(request, params._splat ?? '');
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export const Route = createFileRoute('/api/public/v1/$')({
  server: {
    handlers: {
      GET: handle,
      PUT: handle,
      DELETE: handle,
      OPTIONS: async () => {
        const { corsHeaders } = await import('@/lib/public-api.server');
        return new Response(null, { status: 204, headers: corsHeaders });
      },
    },
  },
});
