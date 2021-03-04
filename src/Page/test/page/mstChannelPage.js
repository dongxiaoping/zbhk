
import { BasePage, LiveCoverCpt, MstChannelCpt,PlayingProgramId } from "../component/component"
import React, { Component } from 'react';
import { ElementSate, EventType, KeyCode } from "../util.js"
import ReactDom from 'react-dom';
export class MstChannelPage extends BasePage {
    constructor() {
        super()
        this.pageInfo = {
            playingPragramId: "1",
            category:
                [
                    {
                        number: "01",
                        code: 12,
                        name: "中央一台",
                        elementSate: ElementSate.focus,
                        nowTimePlaying: { pragramId: 1, prgrameName: "欢聚一堂" },
                        program: {
                            "1": { pragramId: 1, prgrameName: "欢聚一堂" },
                            "2": { pragramId: 2, prgrameName: "战狼" }
                        }
                    },
                    {
                        number: "02",
                        code: 123,
                        name: "体育频道",
                        elementSate: ElementSate.normal,
                        nowTimePlaying: { pragramId: 21, prgrameName: "流浪地球" },
                        program: {
                            "21": { pragramId: 21, prgrameName: "流浪地球" },
                            "26": { pragramId: 26, prgrameName: "动物世界" }
                        }
                    }
                ]
        }
    }

    left() {
        super.left()
    }

    right() {
        super.right()
    }

    up() {
        super.up()
        if( this.pageInfo.category[0].elementSate == ElementSate.focus){
            this.pageInfo.category[0].elementSate = ElementSate.normal
            this.pageInfo.category[1].elementSate = ElementSate.focus
        }else{
            this.pageInfo.category[1].elementSate = ElementSate.normal
            this.pageInfo.category[0].elementSate = ElementSate.focus
        }
        this.show()
    }

    down() {
        super.down()
        this.up()
    }

    ok() {
        super.ok()
    }

    show() {
        ReactDom.render(
            <PlayingProgramId.Provider value={this.pageInfo.playingPragramId}>
            <MstChannelCpt pageInfo={this.pageInfo}></MstChannelCpt>
            </PlayingProgramId.Provider>,
            document.getElementById('root')
        );
    }
}