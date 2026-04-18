import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Star } from "lucide-react";

export default function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/books/${id}`).then((res) => res.json()),
      fetch(`/api/books/${id}/recommendations`).then((res) => res.json()),
    ])
      .then(([bookData, recData]) => {
        setBook(bookData);
        setRecommendations(recData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch book details", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!book || book.error) {
    return <div className="text-center py-12">Book not found</div>;
  }

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-6"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {book.title}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {book.author}
            </p>
          </div>
          {book.url && (
            <a
              href={book.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ExternalLink className="mr-1 h-4 w-4" />
              Source
            </a>
          )}
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                AI Genre Classification
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {book.genre || "Unclassified"}
                </span>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">AI Summary</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {book.summary || "No summary available."}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Original Description
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                {book.description}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recommended Books
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {recommendations.map((rec) => (
              <Link
                key={rec.id}
                to={`/books/${rec.id}`}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <h4 className="font-medium text-gray-900 line-clamp-1">
                  {rec.title}
                </h4>
                <p className="text-sm text-gray-500">{rec.author}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
