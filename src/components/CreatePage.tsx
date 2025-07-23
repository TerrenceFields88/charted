import { CreatePostForm } from '@/components/CreatePostForm';

export const CreatePage = () => {
  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <h1 className="text-xl font-bold">Create Post</h1>
      </div>

      <div className="px-4 py-6">
        <CreatePostForm />
      </div>
    </div>
  );
};