/**
 * Tech Icons Component
 * Uses Simple Icons CDN for authentic, original brand logos.
 * Icons are served with their official brand colors.
 */

type IconProps = { className?: string };

const makeSimpleIcon = (slug: string, label: string) =>
  ({ className = 'w-6 h-6' }: IconProps) => (
    <img
      src={`https://cdn.simpleicons.org/${slug}`}
      alt={label}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );

export const ReactIcon       = makeSimpleIcon('react',              'React');
export const NextJsIcon      = makeSimpleIcon('nextdotjs',          'Next.js');
export const TypeScriptIcon  = makeSimpleIcon('typescript',         'TypeScript');
export const TailwindIcon    = makeSimpleIcon('tailwindcss',        'Tailwind CSS');
export const FramerIcon      = makeSimpleIcon('framer',             'Framer');
export const ThreeJsIcon     = makeSimpleIcon('threedotjs',         'Three.js');
export const FigmaIcon       = makeSimpleIcon('figma',              'Figma');
export const NodeJsIcon      = makeSimpleIcon('nodedotjs',          'Node.js');
export const SupabaseIcon    = makeSimpleIcon('supabase',           'Supabase');
export const PostgresIcon    = makeSimpleIcon('postgresql',         'PostgreSQL');
export const GraphQlIcon     = makeSimpleIcon('graphql',            'GraphQL');
export const PythonIcon      = makeSimpleIcon('python',             'Python');
export const OpenAIIcon      = makeSimpleIcon('openai',             'OpenAI');
export const HuggingFaceIcon = makeSimpleIcon('huggingface',        'Hugging Face');
export const AwsIcon         = makeSimpleIcon('amazonaws',          'AWS');
export const VercelIcon      = makeSimpleIcon('vercel',             'Vercel');
export const DockerIcon      = makeSimpleIcon('docker',             'Docker');
export const KubernetesIcon  = makeSimpleIcon('kubernetes',         'Kubernetes');
export const TerraformIcon   = makeSimpleIcon('terraform',          'Terraform');

// Fallback icon (generic clock)
export const DefaultIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
