"""Browser document surface with unchanged text delivery through Comfy."""
from comfy_api.latest import io

DEFAULT_DOCUMENT = '# A creative notebook\n\nEdit in **Raw**, then switch to Rendered.\n\n$$E = mc^2$$\n\n```mermaid\nflowchart LR\n  Text --> View --> Output\n```\n'

class GeneretiDocument(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(node_id='GeneretiDocument', display_name='ꘇ webview',
            category='Genereti / Interactive Sources',
            search_aliases=['genereti', 'webview', 'document', 'browser', 'markdown', 'html', 'text', 'katex', 'mermaid'],
            inputs=[io.Combo.Input('format', options=['markdown', 'html', 'text', 'url'], default='markdown'),
                    io.String.Input('text', default=DEFAULT_DOCUMENT, multiline=True,
                                    extra_dict={'widgetType':'GENERETI_DOCUMENT'})],
            outputs=[io.String.Output(display_name='text')], is_output_node=True,
            description='Edit or display HTML, Markdown with KaTeX/Mermaid, plain text or an embedded page URL. STRING input/output preserves the source. Raw/Rendered changes only the local view. HTML runs in an isolated browser frame; URL pages retain their own app. External sites may prohibit embedding.')

    @classmethod
    def execute(cls, format, text):
        return io.NodeOutput(text, ui={'genereti_document':[text], 'genereti_document_format':[format]})
