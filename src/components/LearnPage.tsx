import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, TrendingUp, Target, Shield, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CourseDetailPage } from '@/components/CourseDetailPage';

export const LearnPage = () => {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const courses = [
    {
      id: 1,
      title: 'Stock Market Basics',
      description: 'Learn the fundamentals of stock trading and market analysis',
      icon: BookOpen,
      lessons: 12,
      duration: '2 hours',
      level: 'Beginner',
    },
    {
      id: 2,
      title: 'Technical Analysis',
      description: 'Master chart patterns, indicators, and trading strategies',
      icon: TrendingUp,
      lessons: 18,
      duration: '4 hours',
      level: 'Intermediate',
    },
    {
      id: 3,
      title: 'Risk Management',
      description: 'Protect your capital with proven risk management techniques',
      icon: Shield,
      lessons: 10,
      duration: '2.5 hours',
      level: 'All Levels',
    },
    {
      id: 4,
      title: 'Trading Psychology',
      description: 'Develop the mental edge needed for successful trading',
      icon: Target,
      lessons: 8,
      duration: '1.5 hours',
      level: 'All Levels',
    },
  ];

  const articles = [
    {
      id: 1,
      title: 'Understanding Market Trends',
      excerpt: 'Learn to identify and trade with market trends effectively',
      readTime: '5 min',
      category: 'Analysis',
    },
    {
      id: 2,
      title: 'Top 10 Trading Mistakes to Avoid',
      excerpt: 'Common pitfalls that new traders face and how to avoid them',
      readTime: '8 min',
      category: 'Strategy',
    },
    {
      id: 3,
      title: 'Building Your First Trading Plan',
      excerpt: 'Step-by-step guide to creating a solid trading plan',
      readTime: '10 min',
      category: 'Planning',
    },
  ];

  if (selectedCourse !== null) {
    const course = courses.find(c => c.id === selectedCourse);
    return (
      <CourseDetailPage
        courseId={selectedCourse}
        courseTitle={course?.title || ''}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <h1 className="text-xl font-bold">Learn</h1>
        <p className="text-sm text-muted-foreground">Master trading skills and strategies</p>
      </div>

      <div className="px-4 py-4 space-y-6">
        <Tabs defaultValue="courses" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-4">
            {courses.map((course) => {
              const Icon = course.icon;
              return (
                <Card 
                  key={course.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedCourse(course.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <CardDescription>{course.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{course.lessons} lessons</span>
                        <span>•</span>
                        <span>{course.duration}</span>
                        <span>•</span>
                        <span className="text-primary font-medium">{course.level}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCourse(course.id);
                        }}
                      >
                        <PlayCircle className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="articles" className="space-y-4">
            {articles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                        {article.category}
                      </span>
                      <span className="text-xs text-muted-foreground">{article.readTime} read</span>
                    </div>
                    <CardTitle className="text-lg">{article.title}</CardTitle>
                    <CardDescription>{article.excerpt}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
