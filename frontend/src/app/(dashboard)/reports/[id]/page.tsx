import ReportView from './view';

export function generateStaticParams() {
  return [{ id: 'default' }];
}

export default function Page() {
  return <ReportView />;
}
