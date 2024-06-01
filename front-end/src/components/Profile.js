import React from 'react';


export default function Profile() {

    const name = 'juan';
    const role = 'juan';


    return (

        <div className='flex flex-col'>
            <h3 className='pb-4 text-3xl font-bold text-gray-900 sm:pb-6 lg:pb-8'>
                User Profile
            </h3>
            <div className='flex flex-col'>
                <div>
                    {name && role &&
                        <div className="flex py-2">
                            <p className='truncate'>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 inline-block">
                                    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                                </svg>
                                <span className="font-bold ml-3 mr-3">Full name:</span> {role} {name}
                            </p>
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}