import { useEffect } from 'react';
import { request } from '@strapi/helper-plugin';

const Initializer = ({ setPlugin }) => {
  useEffect(() => {
    const fetchData = async () => {
      const response = await request('/hello-world/welcome');
      console.log(response);
    };

    fetchData();
  }, []);

  return null;
};

export default Initializer;
