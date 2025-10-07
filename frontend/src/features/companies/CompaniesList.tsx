'use client';

import { useEffect, useState } from 'react';

// Define a type for the company data for better type safety
type Company = {
  id: number;
  name: string;
  inn: string;
  region: string | null;
};

export default function CompaniesList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('You are not authenticated.');
          setIsLoading(false);
          return;
        }

        const res = await fetch('http://localhost:8000/companies', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setCompanies(data);
        } else {
          setError('Failed to fetch companies. You may not have permission.');
        }
      } catch (err) {
        setError('An error occurred while fetching data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  if (isLoading) {
    return <p>Loading companies...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>Companies Registry</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>INN</th>
            <th>Region</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id}>
              <td>{company.id}</td>
              <td>{company.name}</td>
              <td>{company.inn}</td>
              <td>{company.region || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
