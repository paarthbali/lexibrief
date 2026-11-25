import Icon from "./Icon";

export default function EmptyState({ icon = "inbox", title, children, action }) {
  return (
    <div className="card reveal flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brass/10 text-brass">
        <Icon name={icon} size={26} />
      </span>
      <p className="mt-5 font-serif text-xl">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
