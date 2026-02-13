"use client";

import { companyCategories, CompanyCategory } from "@/data/target-companies";
import { useState } from "react";

export default function CompaniesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = companyCategories.filter((cat) => {
    if (selectedCategory && cat.id !== selectedCategory) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      cat.name.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q) ||
      cat.companies.some(
        (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      )
    );
  });

  const filterCompanies = (cat: CompanyCategory) => {
    if (!search) return cat.companies;
    const q = search.toLowerCase();
    return cat.companies.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  };

  const totalCompanies = companyCategories.reduce((sum, cat) => sum + cat.companies.length, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-dark dark:text-white mb-2">
          Каталог компаний и отраслей
        </h1>
        <p className="text-sm text-neutral dark:text-white/60">
          {companyCategories.length} отраслей, {totalCompanies}+ типов организаций, нуждающихся в метрологических услугах
        </p>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 sm:max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Поиск по отраслям и компаниям..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-light text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !selectedCategory
                ? "gradient-primary text-white"
                : "bg-white dark:bg-dark-light text-neutral hover:bg-gray-50"
            }`}
          >
            Все
          </button>
          {companyCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat.id
                  ? "gradient-primary text-white"
                  : "bg-white dark:bg-dark-light text-neutral hover:bg-gray-50"
              }`}
            >
              {cat.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-8 text-center">
          <p className="text-neutral">Ничего не найдено</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCategories.map((cat) => {
            const companies = filterCompanies(cat);
            if (companies.length === 0 && search) return null;

            return (
              <div key={cat.id} className="bg-white dark:bg-dark-light rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={cat.icon} />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-bold text-dark dark:text-white">{cat.name}</h2>
                      <p className="text-sm text-neutral dark:text-white/60 mt-1">{cat.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {cat.services.map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {(search ? companies : cat.companies).map((company) => (
                    <div key={company.name} className="px-5 py-3 flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-dark dark:text-white">{company.name}</div>
                        <div className="text-xs text-neutral dark:text-white/50">{company.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
