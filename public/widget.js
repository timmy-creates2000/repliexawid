/**
 * Repliexa Widget Embed Script
 * Usage: <script src="https://yourapp.vercel.app/widget.js" data-user-id="USER_ID"></script>
 */
(function () {
  const script = document.currentScript || document.querySelector('script[data-user-id]');
  const userId = script && script.getAttribute('data-user-id');
  if (!userId) {
    console.warn('[Repliexa] data-user-id attribute is required on the widget script tag.');
    return;
  }

  const origin = script.src.replace('/widget.js', '');

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = `${origin}/chat/${userId}`;
  iframe.style.cssText = [
    'position:fixed',
    'bottom:0',
    'right:0',
    'width:420px',
    'height:640px',
    'border:none',
    'z-index:999999',
    'background:transparent',
  ].join(';');
  iframe.allow = 'microphone';
  iframe.title = 'Repliexa Chat Widget';

  document.body.appendChild(iframe);
})();
