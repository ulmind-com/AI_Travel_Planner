import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';

export const StoryBar = ({ stories, isStoriesLoading }) => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [constraints, setConstraints] = useState({ left: 0, right: 0 });

  // Memoize grouped stories logic
  const groupedStories = useMemo(() => {
    if (!stories) return [];
    
    const reduced = stories.reduce((acc, story) => {
      const uId = story.userId?._id || story.firebaseUid;
      if (!uId) return acc;
      
      if (!acc[uId]) {
        acc[uId] = { ...story, groupedCount: 1 };
      } else {
        acc[uId].groupedCount += 1;
      }
      return acc;
    }, {});
    
    return Object.values(reduced);
  }, [stories]);

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const contentWidth = containerRef.current.scrollWidth;
      setConstraints({
        left: -Math.max(0, contentWidth - containerWidth),
        right: 0
      });
    }
  }, [stories, isStoriesLoading, groupedStories]);

  return (
    <div ref={containerRef} className="overflow-hidden pb-4 cursor-grab active:cursor-grabbing select-none">
      <motion.div 
        drag="x"
        dragConstraints={constraints}
        dragElastic={0.1}
        className="flex gap-4 w-max"
      >
        {/* Add Story Button */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex flex-col items-center gap-2 cursor-pointer group shrink-0"
          onClick={() => navigate('/stories')}
        >
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-dashed border-primary/50 group-hover:bg-primary/30 transition-all">
            <PlusCircle size={24} className="text-primary" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Add Story</span>
        </motion.div>

        {/* Loading Skeletons */}
        {isStoriesLoading ? (
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-16 h-16 rounded-full bg-muted animate-pulse shrink-0" />
          ))
        ) : (
          /* Grouped Stories Render */
          groupedStories.map((groupedStory) => (
            <motion.div 
              key={groupedStory.userId?._id || groupedStory.firebaseUid}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center gap-2 cursor-pointer relative shrink-0"
              onClick={() => navigate(`/stories?user=${groupedStory.userId?._id || groupedStory.firebaseUid}`)}
            >
              <div className="w-16 h-16 rounded-full border-2 border-pink-500 p-0.5 shadow-lg shadow-pink-500/20 relative">
                <img 
                  src={groupedStory.userId?.profilepicture || 'https://via.placeholder.com/150'} 
                  className="w-full h-full rounded-full object-cover pointer-events-none"
                  alt={groupedStory.userId?.username}
                />
                {groupedStory.groupedCount > 1 && (
                  <div className="absolute -top-1 -right-1 bg-primary text-[10px] text-white font-black px-1.5 py-0.5 rounded-full border-2 border-background shadow-md">
                    {groupedStory.groupedCount}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter truncate w-16 text-center">
                {groupedStory.userId?.username || 'Traveler'}
              </span>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};
