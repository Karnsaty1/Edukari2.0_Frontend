import { Link } from 'react-router-dom';

const PageHero = ({ kicker, title, description, primaryAction, secondaryAction }) => {
  const renderAction = (action, variant) => {
    if (!action) return null;

    const className =
      variant === 'primary'
        ? 'bg-yellow-400 text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors'
        : 'bg-white/10 backdrop-blur-sm border border-white/20 px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors';

    if (action.to) {
      return (
        <Link to={action.to} className={className}>
          {action.label}
        </Link>
      );
    }

    if (action.href) {
      return (
        <a href={action.href} className={className}>
          {action.label}
        </a>
      );
    }

    return (
      <button type="button" onClick={action.onClick} className={className}>
        {action.label}
      </button>
    );
  };

  return (
    <section className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white py-[3.6rem] sm:py-[4.5rem] lg:py-[5.4rem]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {kicker ? (
            <div className="inline-flex items-center rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm font-semibold text-white/90">
              {kicker}
            </div>
          ) : null}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-5 leading-tight">{title}</h1>
          {description ? (
            <p className="text-lg sm:text-xl text-blue-100 mt-5">{description}</p>
          ) : null}
          {primaryAction || secondaryAction ? (
            <div className="flex flex-wrap gap-4 mt-8">
              {renderAction(primaryAction, 'primary')}
              {renderAction(secondaryAction, 'secondary')}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default PageHero;
