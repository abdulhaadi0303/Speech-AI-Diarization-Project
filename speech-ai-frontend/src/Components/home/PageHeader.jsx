import React from 'react';

const PageHeader = () => {
  return (
    <>
      {/* Main Title Section - No Add New Button */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <span className="text-white text-xl mr-2">Exploration &</span>
          <span className="text-cyan-400 text-xl font-semibold">Interviews</span>
        </div>
        <h1 className="text-4xl font-light text-white mb-2">
          <span className="text-cyan-400">"</span>
          Turn Spoken Thoughts Into Smart Actions
          <span className="text-cyan-400">"</span>
        </h1>
      </div>
    </>
  );
};

export default PageHeader;