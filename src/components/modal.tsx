import React from "react";

interface ModalProps {
  image: string;
  close: () => void;
}

interface ModalState {
  zoomed: boolean;
}

const SVG_CLOSE = `<svg fill="none" stroke="currentColor" width="24" height="24" viewBox="0 0 24 24"stroke-width="2" s
troke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2
="18"></line></svg>`;
const SVG_ZOOM = `<svg fill="none" stroke="currentColor" width="22" height="22" viewBox="0 0 24 24" stroke-width="2" s
troke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 
3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`;
const SVG_UNZOOM = `<svg fill="none" stroke="currentColor" width="22" height="22" viewBox="0 0 24 24" stroke-width="2"
 stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 
14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`;

export default class Modal extends React.Component<ModalProps, ModalState> {
  state = {
    zoomed: false
  };

  render() {
    let containerClasses = "modal-container";
    if (this.state.zoomed) {
      containerClasses += " modal-zoomed";
    } else {
      containerClasses += " modal-unzoomed";
    }

    return (
      <div id="modal" className="modal-back">
        <div id="modal-container" className={containerClasses}>
          <header>
            <div id="modal-controls" className="modal-controls">
              <span
                id="close"
                dangerouslySetInnerHTML={{ __html: SVG_CLOSE }}
                onClick={() => this.props.close()}
              />
              {this.state.zoomed && (
                <span
                  id="unzoom"
                  dangerouslySetInnerHTML={{ __html: SVG_UNZOOM }}
                  onClick={() => this.setState({ zoomed: false })}
                />
              )}
              {~this.state.zoomed && (
                <span
                  id="zoom"
                  dangerouslySetInnerHTML={{ __html: SVG_ZOOM }}
                  onClick={() => this.setState({ zoomed: true })}
                />
              )}
            </div>
            <div className="viewer-metadata">
              <span id="viewer-description" />
              <span id="viewer-src">
                <a href="#">{this.props.image}</a>
              </span>
            </div>
          </header>
          <div
            id="modal-content"
            className="modal-content"
            onClick={() => this.props.close()}
          >
            <img src={encodeURI(this.props.image)} />
          </div>
        </div>
      </div>
    );
  }
}
