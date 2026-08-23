import StudentsManager from '../../components/StudentsManager.jsx';
import { HelpCard } from '../../components/HelpCenter.jsx';

export default function Results() {
  return (
    <StudentsManager
      mode="results"
      help={
        <HelpCard
          className="mb-4"
          description="Follow the steps to review, correct and publish calculated results."
          videoLabel="Watch Publish Results Tutorial"
        />
      }
    />
  );
}