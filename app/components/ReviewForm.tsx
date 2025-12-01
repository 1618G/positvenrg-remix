import { Form } from "@remix-run/react";
import { useState } from "react";

interface ReviewFormProps {
  appointmentId: string;
  companionId: string;
  onSubmit?: () => void;
}

export function ReviewForm({ appointmentId, companionId, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  return (
    <Form method="post" action="/api/reviews" className="space-y-4">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <input type="hidden" name="companionId" value={companionId} />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <label className="block text-sm font-medium text-charcoal-700 mb-2">
          Rating *
        </label>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-3xl ${
                star <= rating ? "text-yellow-400" : "text-gray-300"
              } hover:text-yellow-400 transition-colors`}
            >
              ⭐
            </button>
          ))}
          <span className="ml-2 text-sm text-charcoal-600">{rating}/5</span>
        </div>
      </div>

      <div>
        <label htmlFor="reviewText" className="block text-sm font-medium text-charcoal-700 mb-2">
          Review (Optional)
        </label>
        <textarea
          id="reviewText"
          name="reviewText"
          rows={4}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          maxLength={1000}
          className="w-full px-4 py-2 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-sunrise-500 focus:border-transparent"
          placeholder="Share your experience..."
        />
        <p className="text-xs text-charcoal-500 mt-1">
          {reviewText.length}/1000 characters
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isPublic"
          name="isPublic"
          defaultChecked
          className="rounded border-charcoal-300"
        />
        <label htmlFor="isPublic" className="text-sm text-charcoal-700">
          Make this review public
        </label>
      </div>

      <button
        type="submit"
        onClick={onSubmit}
        className="btn-primary w-full"
      >
        Submit Review
      </button>
    </Form>
  );
}

