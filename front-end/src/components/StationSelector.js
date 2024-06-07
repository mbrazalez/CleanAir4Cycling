import React from 'react';

const StationSelector = ({ options, selectedOptions, onChange }) => {
  return (
    <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 mt-2">
      {options.map((option) => (
        <div key={option.value} className="flex ml-4 text-4xl font-thin text-gray-900 dark:text-white">
        <input className="mr-1 bg-green-50 border border-green-500 text-green-900 dark:text-green-400 placeholder-green-700 dark:placeholder-green-500 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block  dark:bg-gray-700 dark:border-green-500"
            type="checkbox"
            id={option.value}
            value={option.value}
            checked={selectedOptions.includes(option.value)}
            onChange={onChange}
          />
          <label htmlFor={option.value} className="font-semibold text-sm text-gray-900 dark:text-white">{option.label}</label>
        </div>
      ))}
    </div>
  );
};

export default StationSelector;
