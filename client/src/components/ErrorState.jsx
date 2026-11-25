import Icon from "./Icon";

export default function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="card reveal flex flex-col items-center px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-danger/10 text-danger">
        <Icon name="alert" size={26} />
      </span>
      <p className="mt-5 font-serif text-xl">Something went wrong</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{message || "Please try again."}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm mt-6">
          <Icon name="refresh" size={16} />
          Try again
        </button>
      )}
    </div>
  );
}
