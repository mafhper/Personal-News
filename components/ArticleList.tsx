
import React from 'react';
import type { Article } from '../types';
import { ArticleItem } from './ArticleItem';

interface ArticleListProps {
    articles: Article[];
}

export const ArticleList: React.FC<ArticleListProps> = ({ articles }) => {
    return (
        <section aria-labelledby="top-stories-heading">
            <h3 id="top-stories-heading" className="text-lg font-bold text-[rgb(var(--color-accent))] mb-4 uppercase tracking-wider">Top Stories</h3>
            <ol className="space-y-5" role="list" aria-label="List of top news stories">
                {articles.map((article, index) => (
                    <li key={article.link + index} role="listitem">
                        <ArticleItem article={article} index={index + 1} />
                    </li>
                ))}
            </ol>
        </section>
    );
};
