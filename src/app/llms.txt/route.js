// /llms.txt — a plain-text summary of the studio and its work for AI assistants (llmstxt.org).
import { SITE, PROJECTS, STUDIO } from '@/lib/site';

export const dynamic = 'force-static';

export function GET() {
    const base = SITE.url.replace(/\/$/, '');
    const line = (p) => {
        const bits = [p.client && p.client !== p.title ? p.client : null, p.years, p.disciplines].filter(Boolean).join(' · ');
        return `- [${p.title}](${base}/work/${p.key}): ${p.description}${bits ? ` (${bits})` : ''}`;
    };
    const body = `# ${SITE.name}

> ${SITE.intro.replace(/[[\]]/g, '')}

- Founders: ${STUDIO.founders.join(' and ')}
- Based in: ${STUDIO.locations.join(' and ')}; works worldwide
- Services: ${STUDIO.services.join(', ')}
- Contact: book a call at ${SITE.contact}, or describe a project at ${base}/#brief-title

## Selected projects

${PROJECTS.filter((p) => p.group === 'selected').map(line).join('\n')}

## Project archive

${PROJECTS.filter((p) => p.group === 'archive').map(line).join('\n')}
`;
    return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
