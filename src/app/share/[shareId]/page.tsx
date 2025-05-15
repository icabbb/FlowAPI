// app/(site)/shared-flow/[shareId]/page.tsx
import { Metadata } from 'next';
import { RedirectType, redirect } from 'next/navigation';

import { getPublicFlow } from '@/services/storage/public-flow-share';
import { AccessTracker } from './access-tracker';
import SharedFlowView from './shared-flow-view';

type ShareParams = Promise<{ shareId: string }>;

/* -------------------------------------------------------------------------- */
/*                               METADATA                                    */
/* -------------------------------------------------------------------------- */
export async function generateMetadata(
  { params }: { params: ShareParams },
): Promise<Metadata> {
  const { shareId } = await params;

  if (!shareId) {
    return {
      title: 'Flow Not Found',
      description: 'The requested flow could not be found.',
    };
  }

  try {
    const flow = await getPublicFlow(shareId);

    if (!flow) {
      return {
        title: 'Flow Not Found',
        description: 'The requested flow could not be found.',
      };
    }

    const title = `${flow.name || 'Shared Flow'} | Graph Canvas`;
    const description = flow.description || 'A shared flow from Graph Canvas';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
    };
  } catch {
    return {
      title: 'Shared Flow | Graph Canvas',
      description: 'A shared flow from Graph Canvas',
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                               PAGE                                         */
/* -------------------------------------------------------------------------- */
export default async function SharedFlowPage(
  { params }: { params: ShareParams },
) {
  const { shareId } = await params;

  if (!shareId) redirect('/', RedirectType.replace);

  try {
    const flow = await getPublicFlow(shareId);

    if (!flow) {
      return (
        <div className="flex flex-col items-center justify-center h-screen px-4 text-center dark-cartoon">
          <h1 className="mb-4 text-4xl font-bold text-neutral-800 dark:text-blue-200">
            Flow Not Found
          </h1>
          <p className="mb-8 text-lg text-neutral-600 dark:text-blue-400">
            The flow you are looking for does not exist or has been removed.
          </p>
          <a
            href="/"
            className="px-4 py-2 transition-colors border-2 rounded bg-blue-600 text-white hover:bg-blue-700 border-blue-400 dark:border-blue-700"
          >
            Return Home
          </a>
        </div>
      );
    }

    return (
      <>
        {/* Invisible component that tracks visits */}
        <AccessTracker shareId={shareId} />

        {/* Main shared flow view component */}
        <SharedFlowView flow={flow} shareId={shareId} />
      </>
    );
  } catch {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4 text-center dark-cartoon">
        <h1 className="mb-4 text-4xl font-bold text-neutral-800 dark:text-blue-200">
          Error Loading Flow
        </h1>
        <p className="mb-8 text-lg text-neutral-600 dark:text-blue-400">
          There was an error loading this flow. Please try again later.
        </p>
        <a
          href="/"
          className="px-4 py-2 transition-colors border-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 border-blue-400 dark:border-blue-700"
        >
          Return Home
        </a>
      </div>
    );
  }
}
