import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Lesson {
  id: number;
  title: string;
  duration: string;
  videoUrl: string;
  completed: boolean;
}

interface CourseDetailPageProps {
  courseId: number;
  courseTitle: string;
  onBack: () => void;
}

export const CourseDetailPage = ({ courseId, courseTitle, onBack }: CourseDetailPageProps) => {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());

  // Sample lessons with video URLs
  const lessons: Lesson[] = [
    {
      id: 1,
      title: 'Introduction to Stock Markets',
      duration: '8:32',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      completed: completedLessons.has(1),
    },
    {
      id: 2,
      title: 'Understanding Stock Prices',
      duration: '12:45',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      completed: completedLessons.has(2),
    },
    {
      id: 3,
      title: 'Reading Stock Charts',
      duration: '15:20',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      completed: completedLessons.has(3),
    },
    {
      id: 4,
      title: 'Market Orders vs Limit Orders',
      duration: '10:15',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      completed: completedLessons.has(4),
    },
  ];

  const handleLessonComplete = () => {
    setCompletedLessons(prev => new Set(prev).add(lessons[currentLesson].id));
    if (currentLesson < lessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
    }
  };

  const currentLessonData = lessons[currentLesson];

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{courseTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {completedLessons.size}/{lessons.length} lessons completed
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Video Player */}
        <div className="w-full bg-black">
          <VideoPlayer
            src={currentLessonData.videoUrl}
            className="w-full aspect-video"
            autoPlay={false}
          />
        </div>

        {/* Lesson Info */}
        <div className="px-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{currentLessonData.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{currentLessonData.duration}</p>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleLessonComplete}
                className="w-full"
                disabled={completedLessons.has(currentLessonData.id)}
              >
                {completedLessons.has(currentLessonData.id) ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Completed
                  </>
                ) : (
                  'Mark as Complete'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Lessons List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {lessons.map((lesson, index) => (
                    <button
                      key={lesson.id}
                      onClick={() => setCurrentLesson(index)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        index === currentLesson
                          ? 'bg-primary/10 border border-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {completedLessons.has(lesson.id) ? (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
