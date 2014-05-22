/** @jsx React.DOM */
(function () {
    var Pager = React.createClass({
        render: function () {
            return <div className="off-canvas-wrap" data-offcanvas>
                <div className='inner-wrap'>
                    <nav className="tab-bar">
                        <section className="middle tab-bar-section">
                            <h1 className="title">Nome</h1>
                        </section>
                    </nav>
                </div>
            </div>;
        }
    });
    React.renderComponent(<Pager />, document.body);
}());
