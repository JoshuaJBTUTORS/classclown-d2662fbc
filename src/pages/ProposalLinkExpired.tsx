const ProposalLinkExpired = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center border-2 border-foreground rounded-2xl p-8 bg-card shadow-[6px_6px_0px_0px_hsl(var(--foreground))]">
        <h1 className="text-2xl font-bold mb-3">This proposal link is out of date</h1>
        <p className="text-muted-foreground mb-6">
          The link you followed is no longer valid. Please open the most recent
          proposal email we sent you and use the button in that email to view and
          sign your proposal.
        </p>
        <p className="text-sm text-muted-foreground">
          Need help? Call us on 01438 582848 or email{" "}
          <a className="underline" href="mailto:enquiries@classbeyondacademy.io">
            enquiries@classbeyondacademy.io
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default ProposalLinkExpired;
