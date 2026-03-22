"""Screenshot each mermaid diagram section from the HTML page."""
import asyncio
from playwright.async_api import async_playwright

DIAGRAMS = [
    ('architecture', 'architecture.png'),
    ('checkin-flow', 'checkin-flow.png'),
    ('control-flow', 'control-flow.png'),
    ('connections', 'connections.png'),
    ('device-steps', 'device-steps.png'),
    ('bridge', 'bridge.png'),
    ('erd', 'erd.png'),
    ('security', 'security.png'),
    ('sequence', 'sequence.png'),
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1200, 'height': 800})

        print('Loading page...')
        await page.goto('http://localhost:8888/mermaid.html')
        # Wait for mermaid to render all diagrams
        await page.wait_for_timeout(3000)

        for section_id, filename in DIAGRAMS:
            print(f'Screenshotting {section_id}...')
            el = page.locator(f'#{section_id}')
            await el.scroll_into_view_if_needed()
            await page.wait_for_timeout(300)
            out = f'/Users/hungnguyen/Workspace/me/class-presence/docs/slides/diagrams/{filename}'
            await el.screenshot(path=out)
            print(f'  Saved {out}')

        await browser.close()
        print('Done!')

asyncio.run(main())
