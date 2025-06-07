import React, { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  description: string;
  requirements: string[];
}

interface CategorySelectionProps {
  onUpdate: (data: { categoryId: string; subcategoryId: string }) => void;
  data: {
    categoryId: string;
    subcategoryId: string;
  };
}

const CategorySelection: React.FC<CategorySelectionProps> = ({ onUpdate, data }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(data.categoryId);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(data.subcategoryId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // TODO: Replace with actual API call
      const mockCategories: Category[] = [
        {
          id: 'family',
          name: 'Family-Based Immigration',
          description: 'Immigration based on family relationships with U.S. citizens or permanent residents',
          icon: '👨‍👩‍👧‍👦',
          subcategories: [
            {
              id: 'immediate',
              name: 'Immediate Relatives',
              description: 'Spouses, parents, and unmarried children under 21 of U.S. citizens',
              requirements: [
                'Must be a U.S. citizen',
                'Must have a qualifying relationship',
                'Must meet financial requirements'
              ]
            },
            {
              id: 'preference',
              name: 'Family Preference',
              description: 'Other family members of U.S. citizens and permanent residents',
              requirements: [
                'Must be a U.S. citizen or permanent resident',
                'Must have a qualifying relationship',
                'Must meet financial requirements'
              ]
            }
          ]
        },
        {
          id: 'employment',
          name: 'Employment-Based Immigration',
          description: 'Immigration based on employment offers and skills',
          icon: '💼',
          subcategories: [
            {
              id: 'eb1',
              name: 'EB-1: Priority Workers',
              description: 'Individuals with extraordinary abilities, outstanding professors, and multinational executives',
              requirements: [
                'Must demonstrate extraordinary ability',
                'Must have international recognition',
                'Must have significant contributions to the field'
              ]
            },
            {
              id: 'eb2',
              name: 'EB-2: Advanced Degree',
              description: 'Professionals with advanced degrees or exceptional ability',
              requirements: [
                'Must have an advanced degree',
                'Must have a job offer',
                'Must have labor certification'
              ]
            }
          ]
        }
      ];
      setCategories(mockCategories);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories. Please try again.');
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory('');
    onUpdate({ categoryId, subcategoryId: '' });
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    onUpdate({ categoryId: selectedCategory, subcategoryId });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-neutral-800 mb-6">
        Select Immigration Category
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories */}
        <div>
          <h3 className="text-lg font-medium text-neutral-700 mb-4">
            Categories
          </h3>
          <div className="space-y-4">
            {categories.map(category => (
              <div
                key={category.id}
                className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                  selectedCategory === category.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-neutral-200 hover:border-primary-400'
                }`}
                onClick={() => handleCategorySelect(category.id)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-2xl">
                    {category.icon}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-neutral-800">
                      {category.name}
                    </h4>
                    <p className="mt-1 text-sm text-neutral-500">
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subcategories */}
        {selectedCategory && (
          <div>
            <h3 className="text-lg font-medium text-neutral-700 mb-4">
              Subcategories
            </h3>
            <div className="space-y-4">
              {categories
                .find(c => c.id === selectedCategory)
                ?.subcategories.map(subcategory => (
                  <div
                    key={subcategory.id}
                    className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                      selectedSubcategory === subcategory.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-400'
                    }`}
                    onClick={() => handleSubcategorySelect(subcategory.id)}
                  >
                    <h4 className="text-sm font-medium text-neutral-800">
                      {subcategory.name}
                    </h4>
                    <p className="mt-1 text-sm text-neutral-500">
                      {subcategory.description}
                    </p>
                    <div className="mt-2">
                      <h5 className="text-xs font-medium text-neutral-700 mb-1">
                        Requirements:
                      </h5>
                      <ul className="text-xs text-neutral-600 space-y-1">
                        {subcategory.requirements.map((req, index) => (
                          <li key={index} className="flex items-start">
                            <svg
                              className="h-4 w-4 text-primary-600 mr-1 mt-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySelection; 