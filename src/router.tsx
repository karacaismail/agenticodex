import { createBrowserRouter, createHashRouter, type RouteObject } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RouteError } from '@/pages/RouteError';

const page = (loader: () => Promise<{ default: React.ComponentType }>) => async () => ({ Component: (await loader()).default });

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, lazy: page(() => import('@/pages/HomePage')) },
      { path: 'sentez', lazy: page(() => import('@/pages/SynthesisPage')) },
      { path: 'araclar', lazy: page(() => import('@/pages/ToolsPage')) },
      { path: 'araclar/:id', lazy: page(() => import('@/pages/ToolDetailPage')) },
      { path: 'altin-kumeler', lazy: page(() => import('@/pages/GoldenPage')) },
      { path: 'altin-kumeler/:id', lazy: page(() => import('@/pages/GoldenDetailPage')) },
      { path: 'gruplar', lazy: page(() => import('@/pages/GroupsPage')) },
      { path: 'gruplar/:dim', lazy: page(() => import('@/pages/GroupsPage')) },
      { path: 'gruplar/:dim/:value', lazy: page(() => import('@/pages/GroupValuePage')) },
      { path: 'kumeler', lazy: page(() => import('@/pages/ClustersPage')) },
      { path: 'kumeler/ozel', lazy: page(() => import('@/pages/CustomClusterPage')) },
      { path: 'kumeler/topluluk/:id', lazy: page(() => import('@/pages/CommunityPage')) },
      { path: 'kumeler/kova/:id', lazy: page(() => import('@/pages/BucketPage')) },
      { path: 'kumeler/:id', lazy: page(() => import('@/pages/SmartClusterPage')) },
      { path: 'akislar', lazy: page(() => import('@/pages/WorkflowsPage')) },
      { path: 'akislar/aile/:id', lazy: page(() => import('@/pages/WorkflowsPage')) },
      { path: 'akislar/:id', lazy: page(() => import('@/pages/WorkflowDetailPage')) },
      { path: 'uretici', lazy: page(() => import('@/pages/BuilderPage')) },
      { path: 'konular', lazy: page(() => import('@/pages/TopicsPage')) },
      { path: 'konular/:id', lazy: page(() => import('@/pages/TopicDetailPage')) },
      { path: 'segmentler/:id', lazy: page(() => import('@/pages/SegmentPage')) },
      { path: 'kanit', lazy: page(() => import('@/pages/EvidencePage')) },
      { path: 'kanit/:slug', lazy: page(() => import('@/pages/ClaimDetailPage')) },
      { path: 'kaynaklar', lazy: page(() => import('@/pages/SourcesPage')) },
      { path: 'kaynaklar/:id', lazy: page(() => import('@/pages/SourceDetailPage')) },
      { path: 'ag', lazy: page(() => import('@/pages/NetworkPage')) },
      { path: 'radar', lazy: page(() => import('@/pages/RadarPage')) },
      { path: 'karsilastir', lazy: page(() => import('@/pages/ComparePage')) },
      { path: 'harita', lazy: page(() => import('@/pages/SitemapPage')) },
      { path: 'mermaid-sagligi', lazy: page(() => import('@/pages/MermaidHealthPage')) },
      { path: '*', lazy: page(() => import('@/pages/NotFoundPage')) },
    ],
  },
];

// Pages has no server-side SPA fallback; hash routes survive direct links and reloads.
export const router = import.meta.env.BASE_URL === '/agenticodex/'
  ? createHashRouter(routes)
  : createBrowserRouter(routes);
