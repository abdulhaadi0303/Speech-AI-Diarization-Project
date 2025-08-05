import React from 'react';
import AddNewButton from '../common/AddNewButton';

const PageHeader = () => {
  return (
    <>
      {/* Top Section with Add New Button */}
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <AddNewButton />
      </div>

      {/* Main Title Section */}
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