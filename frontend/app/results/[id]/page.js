import ResultDetailView from '@/components/detection/ResultDetailView';

export const metadata = {
  title: 'Analysis Result — PCB Vision',
};

export default function ResultDetailPage({ params }) {
  return <ResultDetailView id={params.id} />;
}
